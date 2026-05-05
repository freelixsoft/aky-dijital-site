export type MetaAccountSnapshot = {
  id?: string;
  name?: string;
  status?: string;
  currency?: string;
  timezone?: string;
  amountSpent?: string;
  balance?: string;
};

export type MetaCampaignStatus = "Güçlü" | "İncele" | "Riskli";

export type MetaCampaignInsight = {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  results: number;
  roas: number;
  objective?: string;
  deliveryStatus?: string;
  status: MetaCampaignStatus;
};

export type MetaSummary = {
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  campaignCount: number;
  currency?: string;
};

export type MetaInsightsData = {
  account: MetaAccountSnapshot;
  summary: MetaSummary;
  campaigns: MetaCampaignInsight[];
  datePreset: string;
  fetchedAt: string;
};

export type MetaConnectionState = {
  accessToken: string;
  adAccountId: string;
  account: MetaAccountSnapshot;
  connectedAt: string;
};

export type MetaInsightsApiResponse = {
  ok: boolean;
  message: string;
  data?: MetaInsightsData;
  code?: number;
  type?: string;
};
