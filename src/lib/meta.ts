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

export type MetaEntityInsight = {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  results: number;
  roas: number;
  deliveryStatus?: string;
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
  dateFrom?: string;
  dateTo?: string;
  fetchedAt: string;
};

export type MetaCampaignDetailData = {
  campaign: MetaCampaignInsight;
  adsets: MetaEntityInsight[];
  ads: Array<MetaEntityInsight & { adsetId?: string; adsetName?: string }>;
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

export type MetaCampaignDetailApiResponse = {
  ok: boolean;
  message: string;
  data?: MetaCampaignDetailData;
  code?: number;
  type?: string;
};

export type MetaActionReport = {
  id: string;
  createdAt: string;
  title: string;
  status: "success" | "error";
  actionType: string;
  entityName?: string;
  entityId?: string;
  message: string;
  details?: string[];
};

export type MetaOptimizationAction = {
  id: string;
  type: "pause_campaign" | "scale_campaign_note" | "review_campaign" | "refresh_creative_note";
  campaignId: string;
  campaignName: string;
  title: string;
  reason: string;
  impact: string;
  executable: boolean;
  payload?: {
    status?: "ACTIVE" | "PAUSED";
  };
};
