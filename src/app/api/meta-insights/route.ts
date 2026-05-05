import { NextResponse } from "next/server";
import type {
  MetaAccountSnapshot,
  MetaCampaignInsight,
  MetaCampaignStatus,
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

function extractResultsCount(actions?: MetaInsightsRow["actions"]) {
  const priorityActions = [
    "purchase",
    "omni_purchase",
    "offsite_conversion.fb_pixel_purchase",
    "onsite_conversion.purchase",
    "lead",
    "onsite_conversion.lead_grouped",
    "offsite_conversion.fb_pixel_lead",
    "complete_registration",
    "offsite_conversion.fb_pixel_complete_registration"
  ];

  if (!Array.isArray(actions)) return 0;

  for (const targetType of priorityActions) {
    const action = actions.find((item) => item.action_type === targetType);
    if (action) {
      return toNumber(action.value);
    }
  }

  return 0;
}

function extractRoasValue(purchaseRoas?: MetaInsightsRow["purchase_roas"]) {
  if (!Array.isArray(purchaseRoas)) return 0;
  return toNumber(purchaseRoas.find((item) => item.value !== undefined)?.value);
}

function classifyCampaign(campaign: Omit<MetaCampaignInsight, "status">): MetaCampaignStatus {
  if (
    (campaign.spend > 0 && campaign.results <= 0 && campaign.ctr > 0 && campaign.ctr < 1) ||
    campaign.cpc > 20 ||
    (campaign.roas > 0 && campaign.roas < 1.5)
  ) {
    return "Riskli";
  }

  if (campaign.roas >= 3 || campaign.ctr >= 2.5) {
    return "Güçlü";
  }

  return "İncele";
}

function buildSummary(campaigns: MetaCampaignInsight[], currency?: string): MetaSummary {
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
    roas: campaigns.length > 0 ? summary.roasTotal / campaigns.length : 0,
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
        const campaign = {
          campaignId: row.campaign_id || "",
          campaignName: row.campaign_name || meta?.name || "Adsız kampanya",
          spend: toNumber(row.spend),
          impressions: toNumber(row.impressions),
          clicks: toNumber(row.clicks),
          ctr: toNumber(row.ctr),
          cpc: toNumber(row.cpc),
          cpm: toNumber(row.cpm),
          results: extractResultsCount(row.actions),
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
