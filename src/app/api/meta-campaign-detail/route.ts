import { NextResponse } from "next/server";
import type {
  MetaCampaignDetailApiResponse,
  MetaCampaignDetailData,
  MetaCampaignInsight,
  MetaEntityInsight
} from "@/lib/meta";

type RequestBody = {
  accessToken?: string;
  campaign?: MetaCampaignInsight;
  datePreset?: string;
  dateFrom?: string;
  dateTo?: string;
};

type MetaGraphError = {
  message?: string;
  type?: string;
  code?: number;
};

type MetaInsightRow = {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: Array<{ action_type?: string; value?: string }>;
  purchase_roas?: Array<{ value?: string }>;
};

type MetaEntityMetaRow = {
  id?: string;
  name?: string;
  status?: string;
  effective_status?: string;
};

type MetaListResponse<T> = {
  data?: T[];
  paging?: {
    next?: string;
  };
  error?: MetaGraphError;
};

const META_API_VERSION = process.env.META_API_VERSION || "v23.0";

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function findActionValue(actions: MetaInsightRow["actions"], actionTypes: string[]) {
  if (!Array.isArray(actions)) return undefined;

  for (const actionType of actionTypes) {
    const action = actions.find((item) => item.action_type === actionType);
    if (action) return { value: toNumber(action.value), actionType };
  }

  return undefined;
}

function extractResults(actions: MetaInsightRow["actions"], campaign: MetaCampaignInsight) {
  if (campaign.primaryResultAction) {
    const direct = findActionValue(actions, [campaign.primaryResultAction]);
    if (direct) {
      return {
        value: direct.value,
        label: campaign.primaryResultLabel,
        actionType: direct.actionType
      };
    }
  }

  const priorityActions = [
    ...(campaign.campaignType === "sales" ? ["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase", "onsite_conversion.purchase"] : []),
    ...(campaign.campaignType === "leads" ? ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"] : []),
    ...(campaign.campaignType === "messages"
      ? ["onsite_conversion.messaging_conversation_started_7d", "onsite_conversion.messaging_first_reply", "messaging_conversation_started_7d"]
      : []),
    ...(campaign.campaignType === "traffic"
      ? ["profile_visit", "onsite_conversion.profile_visit", "onsite_conversion.instagram_profile_visit", "landing_page_view", "link_click"]
      : []),
    ...(campaign.campaignType === "engagement" ? ["post_engagement", "page_engagement", "video_view", "post_reaction"] : [])
  ];
  const match = findActionValue(actions, priorityActions);

  return {
    value: match?.value || 0,
    label: campaign.primaryResultLabel,
    actionType: match?.actionType
  };
}

function extractRoasValue(purchaseRoas?: MetaInsightRow["purchase_roas"]) {
  if (!Array.isArray(purchaseRoas)) return 0;
  return toNumber(purchaseRoas.find((item) => item.value !== undefined)?.value);
}

function buildDateParams(body: RequestBody): Record<string, string> {
  if (body.datePreset === "custom" && body.dateFrom && body.dateTo) {
    return {
      time_range: JSON.stringify({
        since: body.dateFrom,
        until: body.dateTo
      })
    };
  }

  return {
    date_preset: body.datePreset || "last_30d"
  };
}

function buildGraphUrl(endpoint: string, params: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${META_API_VERSION}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

async function graphList<T>(endpoint: string, params: Record<string, string>, accessToken: string) {
  const rows: T[] = [];
  let nextUrl: string | undefined;
  let page = 0;

  do {
    const response = nextUrl
      ? await fetch(nextUrl, { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" })
      : await fetch(buildGraphUrl(endpoint, { ...params, access_token: accessToken }), {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store"
        });
    const data = (await response.json()) as MetaListResponse<T>;

    if (!response.ok || data.error) {
      throw {
        message: data.error?.message || "Meta kampanya detayı alınamadı.",
        code: data.error?.code,
        type: data.error?.type,
        status: response.status || 400
      };
    }

    rows.push(...(data.data || []));
    nextUrl = data.paging?.next;
    page += 1;
  } while (nextUrl && page < 6);

  return rows;
}

function mapAdSet(row: MetaInsightRow, campaign: MetaCampaignInsight, meta?: MetaEntityMetaRow): MetaEntityInsight {
  const primaryResult = extractResults(row.actions, campaign);

  return {
    id: row.adset_id || "",
    name: row.adset_name || meta?.name || "Adsız ad set",
    spend: toNumber(row.spend),
    impressions: toNumber(row.impressions),
    clicks: toNumber(row.clicks),
    ctr: toNumber(row.ctr),
    cpc: toNumber(row.cpc),
    cpm: toNumber(row.cpm),
    results: primaryResult.value,
    primaryResultLabel: primaryResult.label,
    primaryResultAction: primaryResult.actionType,
    roas: extractRoasValue(row.purchase_roas),
    deliveryStatus: meta?.effective_status || meta?.status
  };
}

function mapAd(row: MetaInsightRow, campaign: MetaCampaignInsight, meta?: MetaEntityMetaRow): MetaCampaignDetailData["ads"][number] {
  const primaryResult = extractResults(row.actions, campaign);

  return {
    id: row.ad_id || "",
    name: row.ad_name || meta?.name || "Adsız reklam",
    adsetId: row.adset_id,
    adsetName: row.adset_name,
    spend: toNumber(row.spend),
    impressions: toNumber(row.impressions),
    clicks: toNumber(row.clicks),
    ctr: toNumber(row.ctr),
    cpc: toNumber(row.cpc),
    cpm: toNumber(row.cpm),
    results: primaryResult.value,
    primaryResultLabel: primaryResult.label,
    primaryResultAction: primaryResult.actionType,
    roas: extractRoasValue(row.purchase_roas),
    deliveryStatus: meta?.effective_status || meta?.status
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const accessToken = body.accessToken?.trim();
    const campaign = body.campaign;

    if (!accessToken || !campaign?.campaignId) {
      return NextResponse.json<MetaCampaignDetailApiResponse>(
        { ok: false, message: "Kampanya detayı için Meta bağlantısı ve kampanya ID gerekli." },
        { status: 400 }
      );
    }

    const dateParams = buildDateParams(body);

    const [adsetRows, adRows, adsetMetaRows, adMetaRows] = await Promise.all([
      graphList<MetaInsightRow>(
        `${campaign.campaignId}/insights`,
        {
          fields: "adset_id,adset_name,spend,impressions,clicks,ctr,cpc,cpm,actions,purchase_roas",
          level: "adset",
          limit: "500",
          ...dateParams
        },
        accessToken
      ),
      graphList<MetaInsightRow>(
        `${campaign.campaignId}/insights`,
        {
          fields: "ad_id,ad_name,adset_id,adset_name,spend,impressions,clicks,ctr,cpc,cpm,actions,purchase_roas",
          level: "ad",
          limit: "500",
          ...dateParams
        },
        accessToken
      ),
      graphList<MetaEntityMetaRow>(
        `${campaign.campaignId}/adsets`,
        {
          fields: "id,name,status,effective_status",
          limit: "500"
        },
        accessToken
      ),
      graphList<MetaEntityMetaRow>(
        `${campaign.campaignId}/ads`,
        {
          fields: "id,name,status,effective_status",
          limit: "500"
        },
        accessToken
      )
    ]);

    const adsetMetaById = new Map(adsetMetaRows.map((item) => [item.id, item]));
    const adMetaById = new Map(adMetaRows.map((item) => [item.id, item]));

    return NextResponse.json<MetaCampaignDetailApiResponse>({
      ok: true,
      message: "Kampanya detayı canlı olarak alındı.",
      data: {
        campaign,
        adsets: adsetRows.filter((row) => row.adset_id).map((row) => mapAdSet(row, campaign, adsetMetaById.get(row.adset_id))),
        ads: adRows.filter((row) => row.ad_id).map((row) => mapAd(row, campaign, adMetaById.get(row.ad_id))),
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    const metaError = error as { message?: string; code?: number; type?: string; status?: number };

    return NextResponse.json<MetaCampaignDetailApiResponse>(
      {
        ok: false,
        message: metaError.message || "Kampanya detayı alınamadı.",
        code: metaError.code,
        type: metaError.type
      },
      { status: metaError.status || 500 }
    );
  }
}
