import { NextResponse } from "next/server";
import type {
  MetaAccountSnapshot,
  MetaCampaignInsight,
  MetaCampaignStatus,
  MetaCampaignType,
  MetaInsightsApiResponse,
  MetaSummary
} from "@/lib/meta";

type RequestBody = {
  accessToken?: string;
  adAccountId?: string;
  datePreset?: string;
  dateFrom?: string;
  dateTo?: string;
};

type MetaAccountResponse = {
  id?: string;
  name?: string;
  account_status?: number;
  currency?: string;
  timezone_name?: string;
  amount_spent?: string;
  balance?: string;
  error?: MetaGraphError;
};

type MetaGraphError = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
};

type MetaInsightsRow = {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: Array<{ action_type?: string; value?: string }>;
  purchase_roas?: Array<{ value?: string }>;
};

type PrimaryResult = {
  value: number;
  label: string;
  actionType?: string;
  campaignType: MetaCampaignType;
};

type MetaCampaignMetaRow = {
  id?: string;
  name?: string;
  status?: string;
  effective_status?: string;
  objective?: string;
};

type MetaListResponse<T> = {
  data?: T[];
  paging?: {
    next?: string;
  };
  error?: MetaGraphError;
};

const META_API_VERSION = process.env.META_API_VERSION || "v23.0";
const allowedDatePresets = new Set([
  "today",
  "yesterday",
  "last_7d",
  "last_14d",
  "last_30d",
  "this_month",
  "last_month",
  "custom"
]);

function normalizeAdAccountId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getStatusLabel(status?: number) {
  const labels: Record<number, string> = {
    1: "Aktif",
    2: "Devre dışı",
    3: "Ödenmemiş bakiye",
    7: "İnceleme bekliyor",
    8: "Uzlaşma bekliyor",
    9: "Askıda",
    100: "Kapatıldı",
    101: "Silindi"
  };

  return typeof status === "number" ? labels[status] || `Durum kodu: ${status}` : "Bilinmiyor";
}

function getCampaignTypeLabel(type: MetaCampaignType) {
  const labels: Record<MetaCampaignType, string> = {
    sales: "Satış",
    traffic: "Trafik",
    messages: "Mesaj",
    leads: "Lead",
    awareness: "Bilinirlik",
    engagement: "Etkileşim",
    app: "Uygulama",
    other: "Diğer"
  };

  return labels[type];
}

function inferCampaignTypeFromObjective(objective?: string): MetaCampaignType {
  const value = (objective || "").toUpperCase();

  if (value.includes("SALES") || value.includes("CONVERSIONS") || value.includes("PRODUCT_CATALOG")) return "sales";
  if (value.includes("LEAD")) return "leads";
  if (value.includes("TRAFFIC") || value.includes("LINK_CLICKS") || value.includes("LANDING_PAGE")) return "traffic";
  if (value.includes("MESSAGES")) return "messages";
  if (value.includes("AWARENESS") || value.includes("REACH")) return "awareness";
  if (value.includes("ENGAGEMENT") || value.includes("VIDEO") || value.includes("POST")) return "engagement";
  if (value.includes("APP")) return "app";

  return "other";
}

function findActionValue(actions: MetaInsightsRow["actions"], actionTypes: string[]) {
  if (!Array.isArray(actions)) return undefined;

  for (const actionType of actionTypes) {
    const action = actions.find((item) => item.action_type === actionType);
    if (action) {
      return { value: toNumber(action.value), actionType };
    }
  }

  return undefined;
}

function inferTypeFromActions(actions?: MetaInsightsRow["actions"]) {
  if (!Array.isArray(actions)) return undefined;
  const actionTypes = actions.map((item) => item.action_type || "").join("|").toLowerCase();

  if (actionTypes.includes("messaging") || actionTypes.includes("message")) return "messages";
  if (actionTypes.includes("purchase")) return "sales";
  if (actionTypes.includes("lead")) return "leads";
  if (actionTypes.includes("profile_visit")) return "traffic";
  if (actionTypes.includes("post_engagement") || actionTypes.includes("page_engagement") || actionTypes.includes("video_view")) {
    return "engagement";
  }

  return undefined;
}

function resolveCampaignType(objectiveType: MetaCampaignType, actionType?: MetaCampaignType): MetaCampaignType {
  if (objectiveType === "sales" || objectiveType === "traffic" || objectiveType === "leads" || objectiveType === "awareness" || objectiveType === "app") {
    return objectiveType;
  }

  if (objectiveType === "engagement" && actionType === "messages") {
    return "messages";
  }

  return actionType || objectiveType;
}

function extractPrimaryResult(
  actions: MetaInsightsRow["actions"],
  objective: string | undefined,
  clicks: number,
  impressions: number
): PrimaryResult {
  const objectiveType = inferCampaignTypeFromObjective(objective);
  const actionType = inferTypeFromActions(actions);
  const campaignType = resolveCampaignType(objectiveType, actionType);
  const actionGroups: Record<MetaCampaignType, { label: string; actions: string[] }> = {
    sales: {
      label: "Satın alma",
      actions: ["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase", "onsite_conversion.purchase"]
    },
    leads: {
      label: "Lead",
      actions: [
        "lead",
        "onsite_conversion.lead_grouped",
        "offsite_conversion.fb_pixel_lead",
        "complete_registration",
        "offsite_conversion.fb_pixel_complete_registration"
      ]
    },
    messages: {
      label: "Mesaj görüşmesi",
      actions: [
        "onsite_conversion.messaging_conversation_started_7d",
        "onsite_conversion.messaging_first_reply",
        "onsite_conversion.total_messaging_connection",
        "messaging_conversation_started_7d"
      ]
    },
    traffic: {
      label: "Profil / site ziyareti",
      actions: [
        "profile_visit",
        "onsite_conversion.profile_visit",
        "onsite_conversion.instagram_profile_visit",
        "instagram_profile_visit",
        "landing_page_view",
        "link_click"
      ]
    },
    engagement: {
      label: "Etkileşim",
      actions: ["post_engagement", "page_engagement", "video_view", "post_reaction"]
    },
    awareness: {
      label: "Gösterim",
      actions: []
    },
    app: {
      label: "Uygulama aksiyonu",
      actions: ["mobile_app_install", "app_custom_event", "omni_app_install"]
    },
    other: {
      label: "Hedef sonuç",
      actions: []
    }
  };

  const group = actionGroups[campaignType];
  const match = findActionValue(actions, group.actions);

  if (match) {
    return {
      value: match.value,
      label: group.label,
      actionType: match.actionType,
      campaignType
    };
  }

  if (campaignType === "traffic") {
    return { value: clicks, label: "Tıklama / ziyaret", campaignType };
  }

  if (campaignType === "awareness") {
    return { value: impressions, label: "Gösterim", campaignType };
  }

  return { value: 0, label: group.label, campaignType };
}

function extractRoasValue(purchaseRoas?: MetaInsightsRow["purchase_roas"]) {
  if (!Array.isArray(purchaseRoas)) return 0;
  return toNumber(purchaseRoas.find((item) => item.value !== undefined)?.value);
}

function classifyCampaign(campaign: Omit<MetaCampaignInsight, "status">): MetaCampaignStatus {
  const costPerResult = campaign.results > 0 ? campaign.spend / campaign.results : 0;
  const hasNoPrimaryResult = campaign.spend > 0 && campaign.results <= 0;
  const lowCtr = campaign.ctr > 0 && campaign.ctr < 1;

  if (campaign.campaignType === "sales") {
    if (hasNoPrimaryResult || lowCtr || campaign.cpc > 20 || (campaign.roas > 0 && campaign.roas < 1.5)) return "Riskli";
    if (campaign.roas >= 3 || (campaign.results > 0 && campaign.ctr >= 2)) return "Güçlü";
    return "İncele";
  }

  if (campaign.campaignType === "traffic") {
    if (hasNoPrimaryResult || lowCtr || campaign.cpc > 20) return "Riskli";
    if (campaign.ctr >= 2 || campaign.results >= 100) return "Güçlü";
    return "İncele";
  }

  if (campaign.campaignType === "messages" || campaign.campaignType === "leads") {
    if (hasNoPrimaryResult || lowCtr || (costPerResult > 0 && costPerResult > 500)) return "Riskli";
    if (campaign.results >= 10 && campaign.ctr >= 1.5) return "Güçlü";
    return "İncele";
  }

  if (hasNoPrimaryResult || lowCtr || campaign.cpc > 20) {
    return "Riskli";
  }

  if (campaign.ctr >= 2.5 || campaign.results >= 1000) {
    return "Güçlü";
  }

  return "İncele";
}

function buildSummary(campaigns: MetaCampaignInsight[], currency?: string): MetaSummary {
  const salesCampaigns = campaigns.filter((campaign) => campaign.campaignType === "sales" && campaign.roas > 0);
  const summary = campaigns.reduce(
    (total, campaign) => ({
      spend: total.spend + campaign.spend,
      impressions: total.impressions + campaign.impressions,
      clicks: total.clicks + campaign.clicks,
      results: total.results + campaign.results,
      roasTotal: total.roasTotal + campaign.roas
    }),
    {
      spend: 0,
      impressions: 0,
      clicks: 0,
      results: 0,
      roasTotal: 0
    }
  );

  return {
    spend: summary.spend,
    impressions: summary.impressions,
    clicks: summary.clicks,
    results: summary.results,
    ctr: summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0,
    cpc: summary.clicks > 0 ? summary.spend / summary.clicks : 0,
    cpm: summary.impressions > 0 ? (summary.spend / summary.impressions) * 1000 : 0,
    roas: salesCampaigns.length > 0 ? salesCampaigns.reduce((total, campaign) => total + campaign.roas, 0) / salesCampaigns.length : 0,
    campaignCount: campaigns.length,
    currency
  };
}

function buildGraphUrl(endpoint: string, params: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${META_API_VERSION}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url;
}

async function graphGet<T>(endpoint: string, params: Record<string, string>, accessToken: string) {
  const url = buildGraphUrl(endpoint, { ...params, access_token: accessToken });
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  const data = (await response.json()) as T & { error?: MetaGraphError };

  if (!response.ok || data.error) {
    const error = data.error;
    throw {
      message: error?.message || "Meta API isteği başarısız oldu.",
      code: error?.code,
      type: error?.type,
      status: response.status || 400
    };
  }

  return data;
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
        message: data.error?.message || "Meta verisi alınamadı.",
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

function buildDateParams(body: RequestBody): { datePreset: string; params: Record<string, string> } {
  const requestedPreset = allowedDatePresets.has(body.datePreset || "") ? body.datePreset || "last_30d" : "last_30d";
  const datePreset = requestedPreset === "custom" && (!body.dateFrom || !body.dateTo) ? "last_30d" : requestedPreset;

  if (datePreset === "custom" && body.dateFrom && body.dateTo) {
    return {
      datePreset,
      params: {
        time_range: JSON.stringify({
          since: body.dateFrom,
          until: body.dateTo
        })
      }
    };
  }

  return {
    datePreset,
    params: {
      date_preset: datePreset
    }
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const accessToken = body.accessToken?.trim();
    const adAccountId = normalizeAdAccountId(body.adAccountId || "");

    if (!accessToken || !adAccountId) {
      return NextResponse.json<MetaInsightsApiResponse>(
        {
          ok: false,
          message: "Canlı veri çekmek için Meta access token ve reklam hesabı ID gerekli."
        },
        { status: 400 }
      );
    }

    const { datePreset, params: dateParams } = buildDateParams(body);

    const accountResponse = await graphGet<MetaAccountResponse>(
      adAccountId,
      {
        fields: "id,name,account_status,currency,timezone_name,amount_spent,balance"
      },
      accessToken
    );

    const account: MetaAccountSnapshot = {
      id: accountResponse.id,
      name: accountResponse.name || adAccountId,
      status: getStatusLabel(accountResponse.account_status),
      currency: accountResponse.currency,
      timezone: accountResponse.timezone_name,
      amountSpent: accountResponse.amount_spent,
      balance: accountResponse.balance
    };

    const [insightRows, campaignMetaRows] = await Promise.all([
      graphList<MetaInsightsRow>(
        `${adAccountId}/insights`,
        {
          fields: "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,actions,purchase_roas",
          level: "campaign",
          limit: "500",
          ...dateParams
        },
        accessToken
      ),
      graphList<MetaCampaignMetaRow>(
        `${adAccountId}/campaigns`,
        {
          fields: "id,name,status,effective_status,objective",
          limit: "500"
        },
        accessToken
      )
    ]);

    const campaignMetaById = new Map(campaignMetaRows.map((campaign) => [campaign.id, campaign]));
    const campaigns = insightRows
      .filter((row) => row.campaign_id)
      .map((row) => {
        const meta = campaignMetaById.get(row.campaign_id);
        const clicks = toNumber(row.clicks);
        const impressions = toNumber(row.impressions);
        const primaryResult = extractPrimaryResult(row.actions, meta?.objective, clicks, impressions);
        const campaign = {
          campaignId: row.campaign_id || "",
          campaignName: row.campaign_name || meta?.name || "Adsız kampanya",
          campaignType: primaryResult.campaignType,
          campaignTypeLabel: getCampaignTypeLabel(primaryResult.campaignType),
          spend: toNumber(row.spend),
          impressions,
          clicks,
          ctr: toNumber(row.ctr),
          cpc: toNumber(row.cpc),
          cpm: toNumber(row.cpm),
          results: primaryResult.value,
          primaryResultLabel: primaryResult.label,
          primaryResultAction: primaryResult.actionType,
          roas: extractRoasValue(row.purchase_roas),
          objective: meta?.objective,
          deliveryStatus: meta?.effective_status || meta?.status
        };

        return {
          ...campaign,
          status: classifyCampaign(campaign)
        };
      })
      .sort((a, b) => b.spend - a.spend);

    const summary = buildSummary(campaigns, account.currency);

    return NextResponse.json<MetaInsightsApiResponse>({
      ok: true,
      message: "Meta reklam verileri canlı olarak alındı.",
      data: {
        account,
        summary,
        campaigns,
        datePreset,
        dateFrom: body.dateFrom,
        dateTo: body.dateTo,
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    const metaError = error as { message?: string; code?: number; type?: string; status?: number };

    return NextResponse.json<MetaInsightsApiResponse>(
      {
        ok: false,
        message:
          metaError.message ||
          "Meta reklam verileri alınamadı. Token izinlerini, reklam hesabı ID bilgisini ve Meta API erişimini kontrol edin.",
        code: metaError.code,
        type: metaError.type
      },
      { status: metaError.status || 500 }
    );
  }
}
