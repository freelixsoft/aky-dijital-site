"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  Gauge,
  History,
  Image as ImageIcon,
  LockKeyhole,
  LineChart,
  MessageSquareText,
  MousePointerClick,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Rocket,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Unplug,
  WandSparkles,
  X,
  type LucideIcon
} from "lucide-react";
import { Fragment, FormEvent, useEffect, useMemo, useState } from "react";
import { quickPrompts } from "@/lib/panel";
import type {
  MetaAccountSnapshot,
  MetaActionReport,
  MetaCampaignDetailApiResponse,
  MetaCampaignDetailData,
  MetaCampaignInsight,
  MetaConnectionState,
  MetaEntityInsight,
  MetaInsightsApiResponse,
  MetaInsightsData,
  MetaOptimizationAction
} from "@/lib/meta";
import {
  getSubscriptionPlan,
  subscriptionStorageKey,
  type SubscriptionState
} from "@/lib/subscription";

const fallbackAnswer =
  "AI ön analizi: En güçlü alan remarketing ve Advantage+ kampanyaları. Soğuk kitle kreatif testinde CTR düşük ve CPC yüksek görünüyor. İlk aksiyon olarak düşük CTR kampanyada kreatif açısını yenileyin, remarketing bütçesini kontrollü artırın ve ROAS düşük kampanyalarda hedef kitleyi yeniden segmentleyin.";

type MetaConnectionResult = {
  ok: boolean;
  message: string;
  code?: number;
  type?: string;
  account?: MetaAccountSnapshot;
};

const metricToneClass = {
  electric: "text-electric bg-electric/12",
  acid: "text-acid bg-acid/12",
  ember: "text-ember bg-ember/12",
  pulse: "text-pulse bg-pulse/12"
} as const;

const campaignStatusClass = {
  Güçlü: "border-acid/30 bg-acid/10 text-acid",
  İncele: "border-electric/30 bg-electric/10 text-electric",
  Riskli: "border-ember/30 bg-ember/10 text-ember"
} as const;

const datePresetLabel: Record<string, string> = {
  today: "Bugün",
  yesterday: "Dün",
  last_7d: "Son 7 gün",
  last_14d: "Son 14 gün",
  last_30d: "Son 30 gün",
  this_month: "Bu ay",
  last_month: "Geçen ay",
  custom: "Özel tarih"
};

const reportStorageKey = "aky-panel-optimization-reports";
const goalsStorageKey = "aky-panel-customer-goals";

type DateFilter = {
  datePreset: string;
  dateFrom: string;
  dateTo: string;
};

type DetailEntityKind = "adset" | "ad";
type DetailEntityRow = MetaEntityInsight & {
  adsetId?: string;
  adsetName?: string;
};

type CustomerGoals = {
  monthlyBudget: number;
  targetResults: number;
  maxCostPerResult: number;
};

const defaultCustomerGoals: CustomerGoals = {
  monthlyBudget: 50000,
  targetResults: 100,
  maxCostPerResult: 500
};

function readGoalNumber(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function getSubscriptionCountdown(expiresAt: string, now = Date.now()) {
  const diff = Math.max(0, new Date(expiresAt).getTime() - now);
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes, totalMinutes };
}

function formatNumber(value: number, fractionDigits = 0) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits
  }).format(value);
}

function formatCurrency(value: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value: number) {
  return `%${formatNumber(value, 2)}`;
}

function formatRoas(value: number) {
  return `${formatNumber(value, 2)}x`;
}

function getCostPerResult(data: MetaInsightsData) {
  if (data.summary.results > 0) {
    return data.summary.spend / data.summary.results;
  }

  return data.summary.spend;
}

function countRiskSignals(data: MetaInsightsData) {
  return data.campaigns.filter((campaign) => {
    const lowCtr = campaign.ctr > 0 && campaign.ctr < 1;
    const noResultSpend = campaign.spend > 0 && campaign.results <= 0;
    const weakRoas = campaign.campaignType === "sales" && campaign.roas > 0 && campaign.roas < 1.5;
    return campaign.status === "Riskli" || lowCtr || noResultSpend || weakRoas;
  }).length;
}

function buildCustomerHealth(data: MetaInsightsData, goals: CustomerGoals) {
  const costPerResult = getCostPerResult(data);
  const budgetUsage = goals.monthlyBudget > 0 ? data.summary.spend / goals.monthlyBudget : 0;
  const resultProgress = goals.targetResults > 0 ? data.summary.results / goals.targetResults : 0;
  const costTargetMet = goals.maxCostPerResult <= 0 || costPerResult <= goals.maxCostPerResult;
  const riskSignals = countRiskSignals(data);
  let score = 55;

  score += Math.min(25, resultProgress * 25);
  score += budgetUsage <= 1 ? 12 : -12;
  score += costTargetMet ? 13 : -13;
  score -= Math.min(24, riskSignals * 6);

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const label = boundedScore >= 75 ? "İyi gidiyor" : boundedScore >= 50 ? "Takipte" : "Müdahale gerekiyor";
  const tone = boundedScore >= 75 ? "acid" : boundedScore >= 50 ? "electric" : "ember";
  const message =
    boundedScore >= 75
      ? "Hesap hedeflere yakın veya hedefin üzerinde ilerliyor."
      : boundedScore >= 50
        ? "Performans izlenebilir seviyede; birkaç nokta düzenli takip istiyor."
        : "Maliyet, sonuç veya risk sinyalleri nedeniyle aksiyon almak gerekiyor.";

  return {
    score: boundedScore,
    label,
    tone,
    message,
    budgetUsage,
    resultProgress,
    costPerResult,
    riskSignals
  };
}

function getCustomerActionLabel(action: MetaOptimizationAction) {
  if (action.executable) return "Kampanyayı Durdur";
  if (action.type === "scale_campaign_note") return "Büyütme Planı Kaydet";
  if (action.type === "refresh_creative_note") return "Kreatif İsteği Kaydet";
  return "Kontrol Notu Kaydet";
}

function getCampaignCostPerResult(campaign: MetaCampaignInsight) {
  return campaign.results > 0 ? campaign.spend / campaign.results : 0;
}

function isCampaignDeliveryActive(campaign: MetaCampaignInsight) {
  return (campaign.deliveryStatus || "").toUpperCase() === "ACTIVE";
}

function getCampaignStatusExplanation(campaign: MetaCampaignInsight, currency = "TRY") {
  const costPerResult = getCampaignCostPerResult(campaign);
  const resultLabel = campaign.primaryResultLabel || "hedef sonuç";
  const notes: string[] = [];

  if (campaign.status === "Güçlü") {
    notes.push(`${campaign.campaignTypeLabel || "Kampanya"} hedefi için iyi sinyal veriyor.`);
    if (campaign.campaignType === "sales" && campaign.roas >= 3) notes.push(`Satış tarafında ROAS ${formatRoas(campaign.roas)} seviyesinde.`);
    if (campaign.ctr >= 2) notes.push(`CTR ${formatPercent(campaign.ctr)} olduğu için reklam ilgi çekiyor.`);
    if (campaign.results > 0) {
      notes.push(`${formatNumber(campaign.results)} ${resultLabel.toLowerCase()} alınmış; sonuç başı maliyet ${formatCurrency(costPerResult, currency)}.`);
    }
    notes.push("Bu kampanyada acele kapatma yerine kontrollü bütçe ve kreatif varyasyon testi daha doğru olur.");
  } else if (campaign.status === "İncele") {
    notes.push(`${campaign.campaignTypeLabel || "Kampanya"} hedefinde net güçlü ya da kritik risk sinyali yok.`);
    if (campaign.results > 0) notes.push(`${formatNumber(campaign.results)} ${resultLabel.toLowerCase()} var ama performans daha yakından izlenmeli.`);
    if (campaign.ctr > 0) notes.push(`CTR ${formatPercent(campaign.ctr)}, CPC ${formatCurrency(campaign.cpc, currency)}.`);
    notes.push("Kreatif, hedef kitle ve bütçe dağılımı kontrol edilirse karar daha sağlıklı verilir.");
  } else {
    if (campaign.spend > 0 && campaign.results <= 0) notes.push(`${formatCurrency(campaign.spend, currency)} harcama var ama ${resultLabel.toLowerCase()} yok.`);
    if (campaign.ctr > 0 && campaign.ctr < 1) notes.push(`CTR ${formatPercent(campaign.ctr)}; reklam yeterince ilgi çekmiyor olabilir.`);
    if (campaign.cpc > 20) notes.push(`CPC ${formatCurrency(campaign.cpc, currency)} seviyesinde; tıklama maliyeti yüksek.`);
    if (campaign.campaignType === "sales" && campaign.roas > 0 && campaign.roas < 1.5) {
      notes.push(`Satış kampanyasında ROAS ${formatRoas(campaign.roas)}; gelir tarafı zayıf.`);
    }
    notes.push("Bu kampanya için önce kreatif ve hedef kitle kontrolü, gerekirse durdurma önerilir.");
  }

  return notes;
}

function buildEntityEvaluation(row: DetailEntityRow, currency = "TRY") {
  const resultLabel = row.primaryResultLabel || "hedef sonuç";
  const costPerResult = row.results > 0 ? row.spend / row.results : 0;
  const notes = [
    `${formatCurrency(row.spend, currency)} harcama ile ${formatNumber(row.impressions)} gösterim ve ${formatNumber(row.clicks)} tıklama üretmiş.`,
    `${formatNumber(row.results)} ${resultLabel.toLowerCase()} var${row.results > 0 ? `; sonuç başı maliyet ${formatCurrency(costPerResult, currency)}` : ""}.`,
    `CTR ${formatPercent(row.ctr)}, CPC ${formatCurrency(row.cpc, currency)}, CPM ${formatCurrency(row.cpm, currency)}.`
  ];

  if (row.spend > 0 && row.results <= 0) {
    notes.push("Harcama var ama hedef sonuç yok; kreatif, hedef kitle veya teklif mesajı kontrol edilmeli.");
  } else if (row.ctr > 0 && row.ctr < 1) {
    notes.push("CTR düşük görünüyor; ilk görsel/video ve başlık daha net fayda anlatmalı.");
  } else if (row.results > 0 && row.ctr >= 1.5) {
    notes.push("Bu satır çalışıyor; benzer kitle veya kreatif varyasyonla test edilebilir.");
  } else {
    notes.push("Net karar için birkaç gün daha veri biriktirip maliyet ve sonuç trendi izlenmeli.");
  }

  return notes;
}

function buildInterventionBrief(data: MetaInsightsData, goals: CustomerGoals) {
  const health = buildCustomerHealth(data, goals);
  const riskCampaigns = data.campaigns.filter((campaign) => campaign.status === "Riskli").slice(0, 6);

  return [
    `Genel skor ${health.score}/100: ${health.message}`,
    `Bu dönemde ${formatCurrency(data.summary.spend, data.summary.currency)} harcandı. Hedef bütçeye göre kullanım %${formatNumber(
      health.budgetUsage * 100,
      0
    )}.`,
    `Toplam hedef sonuç ${formatNumber(data.summary.results)}; sonuç başı maliyet ${formatCurrency(
      health.costPerResult,
      data.summary.currency
    )}.`,
    riskCampaigns.length > 0
      ? `Müdahale önceliği: ${riskCampaigns
          .map((campaign) => `${campaign.campaignName} (${campaign.primaryResultLabel || "hedef sonuç"}: ${formatNumber(campaign.results)})`)
          .join(", ")}.`
      : "Riskli kampanya görünmüyor; düzenli takip yeterli."
  ];
}

function createReport(input: Omit<MetaActionReport, "id" | "createdAt">): MetaActionReport {
  return {
    ...input,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString()
  };
}

function buildLocalAnalysis(data: MetaInsightsData | null) {
  if (!data || data.campaigns.length === 0) {
    return "Canlı Meta verisi henüz yüklenmedi. Meta bağlantısını kurup verileri yeniledikten sonra AI analiz bu hesaptaki kampanyalara göre hazırlanır.";
  }

  const topRoas = [...data.campaigns].filter((campaign) => campaign.campaignType === "sales" && campaign.roas > 0).sort((a, b) => b.roas - a.roas)[0];
  const highestCpc = [...data.campaigns].sort((a, b) => b.cpc - a.cpc)[0];
  const lowCtr = data.campaigns.find((campaign) => campaign.ctr > 0 && campaign.ctr < 1);

  return [
    `Canlı ön analiz: ${data.summary.campaignCount} kampanyada toplam harcama ${formatCurrency(
      data.summary.spend,
      data.summary.currency
    )}, ortalama CTR ${formatPercent(data.summary.ctr)} ve toplam hedef sonuç ${formatNumber(data.summary.results)}.`,
    topRoas ? `Satış tarafında en güçlü kampanya: ${topRoas.campaignName} (${formatRoas(topRoas.roas)} ROAS).` : "",
    highestCpc && highestCpc.cpc > 0
      ? `En pahalı tıklama: ${highestCpc.campaignName} (${formatCurrency(highestCpc.cpc, data.summary.currency)} CPC).`
      : "",
    lowCtr ? `Düşük ilgi sinyali: ${lowCtr.campaignName} kampanyasında CTR ${formatPercent(lowCtr.ctr)}.` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function buildOptimizationActions(campaigns: MetaCampaignInsight[]): MetaOptimizationAction[] {
  return campaigns.flatMap((campaign) => {
    const actions: MetaOptimizationAction[] = [];
    const resultLabel = campaign.primaryResultLabel || "hedef sonuç";

    if (campaign.spend > 0 && campaign.results <= 0 && campaign.ctr > 0 && campaign.ctr < 1) {
      actions.push({
        id: `pause-${campaign.campaignId}`,
        type: "pause_campaign",
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        title: "Durdurma adayı",
        reason: `Harcama var, ${resultLabel.toLowerCase()} yok ve CTR ${formatPercent(campaign.ctr)}.`,
        impact: "Kampanyayı PAUSED durumuna al",
        executable: true,
        payload: { status: "PAUSED" }
      });
    }

    if (campaign.campaignType === "sales" && campaign.roas >= 3) {
      actions.push({
        id: `scale-${campaign.campaignId}`,
        type: "scale_campaign_note",
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        title: "Ölçekleme fırsatı",
        reason: `${formatRoas(campaign.roas)} ROAS güçlü görünüyor.`,
        impact: "Kontrollü bütçe artışı için manuel plan çıkar",
        executable: false
      });
    }

    if (campaign.campaignType !== "sales" && campaign.results > 0 && campaign.ctr >= 2) {
      actions.push({
        id: `scale-${campaign.campaignId}`,
        type: "scale_campaign_note",
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        title: "Büyütme fırsatı",
        reason: `${campaign.campaignTypeLabel} kampanyasında ${formatNumber(campaign.results)} ${resultLabel.toLowerCase()} ve ${formatPercent(campaign.ctr)} CTR var.`,
        impact: "Aynı hedefte kontrollü bütçe ve kreatif varyasyonu planla",
        executable: false
      });
    }

    if (campaign.cpc > 20) {
      actions.push({
        id: `review-${campaign.campaignId}`,
        type: "review_campaign",
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        title: "Yüksek CPC",
        reason: `CPC ${formatCurrency(campaign.cpc)} seviyesinde.`,
        impact: "Kreatif, hedefleme ve teklif mesajını incele",
        executable: false
      });
    }

    if (campaign.campaignType === "sales" && campaign.roas > 0 && campaign.roas < 1.5) {
      actions.push({
        id: `creative-${campaign.campaignId}`,
        type: "refresh_creative_note",
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        title: "Verimlilik riski",
        reason: `ROAS ${formatRoas(campaign.roas)} düşük.`,
        impact: "Yeni kreatif açısı ve landing page kontrolü öner",
        executable: false
      });
    }

    return actions;
  });
}

type PanelModuleId =
  | "ozet"
  | "meta"
  | "kampanya"
  | "kreatif"
  | "analiz"
  | "optimizasyon"
  | "kampanyalar"
  | "chat";

type PanelModule = {
  id: PanelModuleId;
  icon: LucideIcon;
  title: string;
  description: string;
  accent: "electric" | "acid" | "ember" | "pulse";
};

const panelWorkspaceModules: PanelModule[] = [
  {
    id: "ozet",
    icon: Gauge,
    title: "Özet Metrikler",
    description: "Harcama, CTR, CPC ve ROAS göstergelerini tek bakışta inceleyin.",
    accent: "electric"
  },
  {
    id: "meta",
    icon: ShieldCheck,
    title: "Meta Bağlantısı",
    description: "Access token ve reklam hesabı ID alanlarını güvenli şekilde yönetin.",
    accent: "acid"
  },
  {
    id: "kampanya",
    icon: Rocket,
    title: "Kampanya Oluştur",
    description: "Hedef, bütçe, kitle ve teklif bilgisiyle kampanya taslağı hazırlayın.",
    accent: "electric"
  },
  {
    id: "kreatif",
    icon: WandSparkles,
    title: "AI Kreatif Oluştur",
    description: "Ürün, hedef kitle ve formata göre reklam metni ve kreatif brief üretin.",
    accent: "acid"
  },
  {
    id: "analiz",
    icon: ClipboardList,
    title: "AI Destekli Analiz",
    description: "Kampanya verilerini yönetici özeti ve aksiyon önerisine çevirin.",
    accent: "pulse"
  },
  {
    id: "optimizasyon",
    icon: SlidersHorizontal,
    title: "Optimizasyon",
    description: "Riskli, izlenecek ve ölçeklenecek kampanyaları önceliklendirin.",
    accent: "ember"
  },
  {
    id: "kampanyalar",
    icon: LineChart,
    title: "Kampanya Tablosu",
    description: "Aktif kampanyaları harcama, sonuç ve ROAS kırılımıyla görün.",
    accent: "electric"
  },
  {
    id: "chat",
    icon: MessageSquareText,
    title: "AI Chat",
    description: "Reklam hesabı performansına dair sorularınızı panel içinde sorun.",
    accent: "acid"
  }
];

const workspaceAccentClass = {
  electric: "border-electric/35 bg-electric/10 text-electric",
  acid: "border-acid/35 bg-acid/10 text-acid",
  ember: "border-ember/35 bg-ember/10 text-ember",
  pulse: "border-pulse/35 bg-pulse/10 text-pulse"
} as const;

export function PanelWorkspace() {
  const [activeModule, setActiveModule] = useState<PanelModuleId | null>(null);
  const [connection, setConnection] = useState<MetaConnectionState | null>(null);
  const [metaData, setMetaData] = useState<MetaInsightsData | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    datePreset: "last_30d",
    dateFrom: "",
    dateTo: ""
  });
  const [customerGoals, setCustomerGoals] = useState<CustomerGoals>(defaultCustomerGoals);
  const [reports, setReports] = useState<MetaActionReport[]>([]);
  const [aiTaskLabel, setAiTaskLabel] = useState("");
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [isSubscriptionReady, setIsSubscriptionReady] = useState(false);
  const [subscriptionNow, setSubscriptionNow] = useState(Date.now());
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [gateMessage, setGateMessage] = useState("Önce Meta bağlantısını kurunuz. Bağlantı kurulunca diğer modüller canlı reklam verisiyle açılır.");
  const activeModuleMeta = panelWorkspaceModules.find((module) => module.id === activeModule);
  const isConnected = Boolean(connection);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(reportStorageKey);
      if (stored) {
        setReports(JSON.parse(stored) as MetaActionReport[]);
      }
    } catch {
      setReports([]);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(subscriptionStorageKey);
      setSubscription(stored ? (JSON.parse(stored) as SubscriptionState) : null);
    } catch {
      setSubscription(null);
    } finally {
      setIsSubscriptionReady(true);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setSubscriptionNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(goalsStorageKey);
      if (!stored) return;

      const parsed = JSON.parse(stored) as Partial<CustomerGoals>;
      setCustomerGoals({
        monthlyBudget: readGoalNumber(parsed.monthlyBudget, defaultCustomerGoals.monthlyBudget),
        targetResults: readGoalNumber(parsed.targetResults, defaultCustomerGoals.targetResults),
        maxCostPerResult: readGoalNumber(parsed.maxCostPerResult, defaultCustomerGoals.maxCostPerResult)
      });
    } catch {
      setCustomerGoals(defaultCustomerGoals);
    }
  }, []);

  function saveReport(report: MetaActionReport) {
    setReports((current) => {
      const next = [report, ...current].slice(0, 30);
      window.localStorage.setItem(reportStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function updateReport(reportId: string, patch: Partial<Pick<MetaActionReport, "title" | "message" | "details">>) {
    setReports((current) => {
      const next = current.map((report) => (report.id === reportId ? { ...report, ...patch } : report));
      window.localStorage.setItem(reportStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function deleteReport(reportId: string) {
    setReports((current) => {
      const next = current.filter((report) => report.id !== reportId);
      window.localStorage.setItem(reportStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function saveCustomerGoals(nextGoals: CustomerGoals) {
    setCustomerGoals(nextGoals);
    window.localStorage.setItem(goalsStorageKey, JSON.stringify(nextGoals));
  }

  function runAiTask<T>(label: string, task: () => Promise<T>) {
    setAiTaskLabel(label);
    return task().finally(() => setAiTaskLabel(""));
  }

  async function refreshMetaData(targetConnection = connection, nextFilter = dateFilter) {
    if (!targetConnection) return;

    setIsLoadingData(true);
    setDataError("");

    try {
      const response = await fetch("/api/meta-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: targetConnection.accessToken,
          adAccountId: targetConnection.adAccountId,
          datePreset: nextFilter.datePreset,
          dateFrom: nextFilter.dateFrom,
          dateTo: nextFilter.dateTo
        })
      });
      const result = (await response.json()) as MetaInsightsApiResponse;

      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.message || "Meta reklam verileri alınamadı.");
      }

      setMetaData(result.data);
      setGateMessage("Meta bağlantısı kuruldu. Modüller artık canlı reklam verisiyle çalışıyor.");
    } catch (error) {
      setMetaData(null);
      setDataError(error instanceof Error ? error.message : "Meta reklam verileri alınamadı.");
    } finally {
      setIsLoadingData(false);
    }
  }

  function handleConnected(nextConnection: MetaConnectionState) {
    setConnection(nextConnection);
    setActiveModule("ozet");
    void refreshMetaData(nextConnection);
  }

  function handleDisconnect() {
    setConnection(null);
    setMetaData(null);
    setDataError("");
    setActiveModule("meta");
    setGateMessage("Meta bağlantısı sıfırlandı. Diğer modülleri açmak için yeniden bağlantı kurunuz.");
  }

  function handleDateChange(nextFilter: DateFilter) {
    setDateFilter(nextFilter);
    if (connection) {
      void refreshMetaData(connection, nextFilter);
    }
  }

  function handleModuleClick(module: PanelModule) {
    const isLocked = !isConnected && module.id !== "meta";

    if (isLocked) {
      setGateMessage("Önce Meta bağlantısını kurunuz. Bağlantı olmadan kampanya verisi, AI analiz ve optimizasyon modülleri çalışmaz.");
      setActiveModule("meta");
      return;
    }

    setGateMessage("");
    setActiveModule((current) => (current === module.id ? null : module.id));
  }

  if (!isSubscriptionReady) {
    return <LiveDataState title="Abonelik kontrol ediliyor" text="Panel erişimi için plan durumu kontrol ediliyor." />;
  }

  const activePlan = getSubscriptionPlan(subscription?.planId);
  const countdown = subscription ? getSubscriptionCountdown(subscription.expiresAt, subscriptionNow) : null;

  if (!activePlan || !countdown || countdown.totalMinutes <= 0) {
    return <SubscriptionRequiredNotice subscription={subscription} />;
  }

  return (
    <div id="panel-moduller" className="scroll-mt-28">
      <SubscriptionStatusBanner planName={activePlan.name} countdown={countdown} adAccountLimit={activePlan.adAccountLimit} />
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Panel modülleri</p>
        <h2 className="mt-4 text-balance text-3xl font-black text-white sm:text-4xl">
          Her araç tek yerde, detaylar sadece tıklayınca açık.
        </h2>
        <p className="mt-4 text-sm leading-7 text-fog-400 sm:text-base">
          Panel ilk açıldığında sade kalır. İhtiyacınız olan modülü seçin; bağlantı, kampanya,
          kreatif, analiz ve raporlama ekranları ayrı ayrı açılır.
        </p>
      </div>

      {gateMessage ? (
        <div
          className={`mx-auto mt-6 flex max-w-4xl items-start gap-3 rounded-lg border p-4 text-sm leading-7 ${
            isConnected
              ? "border-acid/25 bg-acid/10 text-fog-100"
              : "border-ember/25 bg-ember/10 text-fog-200"
          }`}
        >
          {isConnected ? <CheckCircle2 className="mt-1 size-5 shrink-0 text-acid" /> : <LockKeyhole className="mt-1 size-5 shrink-0 text-ember" />}
          <span>{gateMessage}</span>
        </div>
      ) : null}

      <div className="mx-auto mt-8 grid max-w-6xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {panelWorkspaceModules.map((module, index) => {
          const Icon = module.icon;
          const isActive = module.id === activeModule;
          const isLocked = !isConnected && module.id !== "meta";

          return (
            <motion.button
              key={module.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.035 }}
              whileHover={isLocked ? undefined : { y: -4 }}
              onClick={() => handleModuleClick(module)}
              className={`group flex min-h-[11rem] w-full flex-col items-start justify-between rounded-lg border p-4 text-left transition ${
                isActive
                  ? `${workspaceAccentClass[module.accent]} shadow-glow`
                  : isLocked
                    ? "border-white/10 bg-white/[0.025] text-fog-500 opacity-70"
                    : "border-white/10 bg-white/[0.045] text-fog-300 hover:border-acid/35 hover:bg-white/[0.07]"
              }`}
              aria-pressed={isActive}
              aria-disabled={isLocked}
            >
              <span className="flex w-full items-start justify-between gap-3">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-lg border ${
                    isActive
                      ? workspaceAccentClass[module.accent]
                      : isLocked
                        ? "border-white/10 bg-carbon-950 text-fog-500"
                        : "border-white/10 bg-carbon-950 text-acid"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="rounded-full border border-white/10 bg-carbon-950/70 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-fog-500">
                  {isActive ? "Açık" : isLocked ? "Kilitli" : "Aç"}
                </span>
              </span>
              <span>
                <span className="block text-lg font-black text-white">{module.title}</span>
                <span className="mt-2 block text-sm leading-6 text-fog-400">{module.description}</span>
              </span>
              <span className={`inline-flex items-center gap-2 text-sm font-bold ${isLocked ? "text-ember" : "text-acid"}`}>
                {isActive ? "Kapat" : isLocked ? "Önce bağlantı" : "Modülü aç"}
                {isLocked ? (
                  <LockKeyhole className="size-4" />
                ) : (
                  <ChevronRight className={`size-4 transition ${isActive ? "rotate-90" : "group-hover:translate-x-1"}`} />
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeModuleMeta ? (
          <motion.div
            key={activeModuleMeta.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="mx-auto mt-8 max-w-6xl"
          >
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-white/10 bg-carbon-900/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Açık modül</p>
                <h3 className="mt-1 text-xl font-black text-white">{activeModuleMeta.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule(null)}
                className="button-ghost w-full justify-center sm:w-auto"
              >
                Modülü Kapat
                <X className="size-4" />
              </button>
            </div>
            <ActivePanelModule
              activeModule={activeModuleMeta.id}
              connection={connection}
              data={metaData}
              dateFilter={dateFilter}
              customerGoals={customerGoals}
              reports={reports}
              isLoadingData={isLoadingData}
              dataError={dataError}
              onConnected={handleConnected}
              onDisconnected={handleDisconnect}
              onDateChange={handleDateChange}
              onCustomerGoalsChange={saveCustomerGoals}
              onReport={saveReport}
              onReportUpdate={updateReport}
              onReportDelete={deleteReport}
              onRefresh={() => void refreshMetaData()}
              runAiTask={runAiTask}
            />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mx-auto mt-8 max-w-3xl rounded-lg border border-white/10 bg-white/[0.035] p-5 text-center"
          >
            <BarChart3 className="mx-auto size-7 text-acid" />
            <p className="mt-3 text-sm leading-7 text-fog-400">
              Şu anda açık bir panel detayı yok. Başlamak için önce Meta bağlantısını açın.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <AiProgressOverlay label={aiTaskLabel} />
    </div>
  );
}

type ActivePanelModuleProps = {
  activeModule: PanelModuleId;
  connection: MetaConnectionState | null;
  data: MetaInsightsData | null;
  dateFilter: DateFilter;
  customerGoals: CustomerGoals;
  reports: MetaActionReport[];
  isLoadingData: boolean;
  dataError: string;
  onConnected: (connection: MetaConnectionState) => void;
  onDisconnected: () => void;
  onDateChange: (filter: DateFilter) => void;
  onCustomerGoalsChange: (goals: CustomerGoals) => void;
  onReport: (report: MetaActionReport) => void;
  onReportUpdate: (reportId: string, patch: Partial<Pick<MetaActionReport, "title" | "message" | "details">>) => void;
  onReportDelete: (reportId: string) => void;
  onRefresh: () => void;
  runAiTask: <T>(label: string, task: () => Promise<T>) => Promise<T>;
};

function ActivePanelModule({
  activeModule,
  connection,
  data,
  dateFilter,
  customerGoals,
  reports,
  isLoadingData,
  dataError,
  onConnected,
  onDisconnected,
  onDateChange,
  onCustomerGoalsChange,
  onReport,
  onReportUpdate,
  onReportDelete,
  onRefresh,
  runAiTask
}: ActivePanelModuleProps) {
  if (activeModule === "meta") {
    return (
      <MetaConnectionCard
        connection={connection}
        data={data}
        isLoadingData={isLoadingData}
        dataError={dataError}
        onConnected={onConnected}
        onDisconnected={onDisconnected}
        onRefresh={onRefresh}
      />
    );
  }

  if (!connection) {
    return <ConnectionRequiredNotice />;
  }

  if (isLoadingData && !data) {
    return <LiveDataState title="Meta verisi yükleniyor" text="Reklam hesabındaki kampanya verileri canlı olarak alınıyor." />;
  }

  if (dataError && !data) {
    return <LiveDataState title="Meta verisi alınamadı" text={dataError} onRefresh={onRefresh} />;
  }

  if (!data) {
    return <LiveDataState title="Canlı veri yok" text="Meta verisini çekmek için bağlantıyı yenileyin." onRefresh={onRefresh} />;
  }

  switch (activeModule) {
    case "ozet":
      return (
        <SummaryModule
          data={data}
          dateFilter={dateFilter}
          customerGoals={customerGoals}
          isLoadingData={isLoadingData}
          dataError={dataError}
          onDateChange={onDateChange}
          onCustomerGoalsChange={onCustomerGoalsChange}
          onRefresh={onRefresh}
          runAiTask={runAiTask}
        />
      );
    case "kampanya":
      return <CampaignCreatorCard connection={connection} data={data} onRefresh={onRefresh} onReport={onReport} />;
    case "kreatif":
      return <CreativeGeneratorCard data={data} runAiTask={runAiTask} />;
    case "analiz":
      return <AiAnalysisCenter data={data} runAiTask={runAiTask} />;
    case "optimizasyon":
      return (
        <OptimizationCenter
          connection={connection}
          data={data}
          reports={reports}
          onRefresh={onRefresh}
          onReport={onReport}
          onReportUpdate={onReportUpdate}
          onReportDelete={onReportDelete}
          runAiTask={runAiTask}
        />
      );
    case "kampanyalar":
      return <CampaignTableModule connection={connection} data={data} dateFilter={dateFilter} onRefresh={onRefresh} onReport={onReport} />;
    case "chat":
      return <PanelChat data={data} runAiTask={runAiTask} />;
    default:
      return null;
  }
}

function ConnectionRequiredNotice() {
  return (
    <div className="surface rounded-lg p-5 text-sm leading-7 text-fog-300">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-ember/25 bg-ember/10 text-ember">
          <LockKeyhole className="size-5" />
        </span>
        <div>
          <h3 className="text-xl font-black text-white">Önce Meta bağlantısını kurunuz.</h3>
          <p className="mt-2">
            Bu modül reklam hesabındaki canlı veriye ihtiyaç duyar. Meta Access Token ve reklam hesabı ID
            doğrulanmadan kampanya, analiz, optimizasyon ve chat modülleri açılmaz.
          </p>
        </div>
      </div>
    </div>
  );
}

function LiveDataState({
  title,
  text,
  onRefresh
}: {
  title: string;
  text: string;
  onRefresh?: () => void;
}) {
  return (
    <div className="surface rounded-lg p-5 text-sm leading-7 text-fog-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-electric/25 bg-electric/10 text-electric">
            <RefreshCw className="size-5" />
          </span>
          <div>
            <h3 className="text-xl font-black text-white">{title}</h3>
            <p className="mt-2">{text}</p>
          </div>
        </div>
        {onRefresh ? (
          <button type="button" className="button-primary shrink-0" onClick={onRefresh}>
            Veriyi Yenile
            <RefreshCw className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SubscriptionStatusBanner({
  planName,
  adAccountLimit,
  countdown
}: {
  planName: string;
  adAccountLimit: number;
  countdown: { days: number; hours: number; minutes: number; totalMinutes: number };
}) {
  return (
    <div className="mb-8 rounded-lg border border-acid/25 bg-acid/10 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-acid">Abonelik aktif</p>
          <h3 className="mt-2 text-xl font-black text-white">{planName} planı</h3>
          <p className="mt-2 text-sm leading-7 text-fog-300">
            Bu plan {adAccountLimit} reklam hesabına kadar kullanım sağlar. Süre bittiğinde panel otomatik kilitlenir.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-carbon-950 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-fog-500">Kalan süre</p>
          <p className="mt-2 text-2xl font-black text-white">
            {countdown.days}g {countdown.hours}s {countdown.minutes}dk
          </p>
          <Link href="/abonelik" className="button-ghost mt-3 w-full justify-center">
            Planı Yenile
            <RefreshCw className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function SubscriptionRequiredNotice({ subscription }: { subscription: SubscriptionState | null }) {
  const isExpired = Boolean(subscription);

  return (
    <div className="mx-auto max-w-4xl rounded-lg border border-ember/25 bg-ember/10 p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-ember/25 bg-carbon-950 text-ember">
            <LockKeyhole className="size-5" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-ember">
              {isExpired ? "Abonelik süresi doldu" : "Abonelik gerekli"}
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">Paneli kullanmak için aktif plan gerekir.</h3>
            <p className="mt-3 text-sm leading-7 text-fog-300">
              Her abonelik 30 gün geçerlidir. Plan yenilenmediğinde Meta bağlantısı, kampanya tablosu, AI analiz ve
              optimizasyon modülleri kilitlenir.
            </p>
          </div>
        </div>
        <Link href="/abonelik" className="button-primary shrink-0 justify-center">
          Abone Ol / Yenile
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function AiProgressOverlay({ label }: { label: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!label) {
      setProgress(0);
      return;
    }

    setProgress(4);
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current < 35) return current + 6;
        if (current < 70) return current + 3;
        if (current < 92) return current + 1;
        return current;
      });
    }, 160);

    return () => window.clearInterval(timer);
  }, [label]);

  if (!label) return null;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const bounded = Math.min(progress, 98);
  const offset = circumference - (bounded / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-carbon-950/75 p-4 backdrop-blur-lg">
      <div className="w-full max-w-sm rounded-lg border border-white/10 bg-carbon-900 p-6 text-center shadow-glow">
        <div className="relative mx-auto size-36">
          <svg className="size-36 -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
            <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="#b7ff3c"
              strokeLinecap="round"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white">
            %{Math.floor(bounded)}
          </div>
        </div>
        <h3 className="mt-5 text-xl font-black text-white">AI Analiz yapılıyor</h3>
        <p className="mt-2 text-sm leading-7 text-fog-400">{label}</p>
      </div>
    </div>
  );
}

function SummaryModule({
  data,
  dateFilter,
  customerGoals,
  isLoadingData,
  dataError,
  onDateChange,
  onCustomerGoalsChange,
  onRefresh,
  runAiTask
}: {
  data: MetaInsightsData;
  dateFilter: DateFilter;
  customerGoals: CustomerGoals;
  isLoadingData: boolean;
  dataError: string;
  onDateChange: (filter: DateFilter) => void;
  onCustomerGoalsChange: (goals: CustomerGoals) => void;
  onRefresh: () => void;
  runAiTask: <T>(label: string, task: () => Promise<T>) => Promise<T>;
}) {
  const metrics = [
    {
      label: "Toplam Harcama",
      value: formatCurrency(data.summary.spend, data.summary.currency),
      helper: datePresetLabel[data.datePreset] || data.datePreset,
      trend: "Canlı",
      tone: "electric"
    },
    {
      label: "Ortalama CTR",
      value: formatPercent(data.summary.ctr),
      helper: `${formatNumber(data.summary.impressions)} gösterim`,
      trend: `${formatNumber(data.summary.clicks)} tık`,
      tone: "acid"
    },
    {
      label: "Ortalama CPC",
      value: formatCurrency(data.summary.cpc, data.summary.currency),
      helper: "Tıklama maliyeti",
      trend: `${data.summary.currency || "TRY"}`,
      tone: "pulse"
    },
    {
      label: "ROAS",
      value: formatRoas(data.summary.roas),
      helper: `${data.summary.campaignCount} kampanya`,
      trend: `${formatNumber(data.summary.results)} sonuç`,
      tone: "ember"
    }
  ] as const;
  const topSpend = [...data.campaigns].sort((a, b) => b.spend - a.spend)[0];
  const topRoas = [...data.campaigns].filter((campaign) => campaign.campaignType === "sales" && campaign.roas > 0).sort((a, b) => b.roas - a.roas)[0];
  const topEfficiency = topRoas || [...data.campaigns].sort((a, b) => b.results - a.results || b.ctr - a.ctr)[0];
  const worstCtr = [...data.campaigns].filter((campaign) => campaign.ctr > 0).sort((a, b) => a.ctr - b.ctr)[0];
  const highestCpc = [...data.campaigns].sort((a, b) => b.cpc - a.cpc)[0];
  const [goalNotice, setGoalNotice] = useState("");
  const [interventionAnalysis, setInterventionAnalysis] = useState("");
  const [isInterventionOpen, setIsInterventionOpen] = useState(false);
  const alerts = data.campaigns
    .flatMap((campaign) => {
      const items: string[] = [];
      const resultLabel = campaign.primaryResultLabel || "hedef sonuç";
      if (campaign.ctr > 0 && campaign.ctr < 1) items.push(`${campaign.campaignName}: CTR düşük (${formatPercent(campaign.ctr)})`);
      if (campaign.cpc > 20) items.push(`${campaign.campaignName}: CPC yüksek (${formatCurrency(campaign.cpc, data.summary.currency)})`);
      if (campaign.spend > 0 && campaign.results <= 0) items.push(`${campaign.campaignName}: harcama var ama ${resultLabel.toLowerCase()} yok`);
      if (campaign.campaignType === "sales" && campaign.roas > 0 && campaign.roas < 1.5) {
        items.push(`${campaign.campaignName}: ROAS düşük (${formatRoas(campaign.roas)})`);
      }
      return items;
    })
    .slice(0, 6);
  const health = buildCustomerHealth(data, customerGoals);
  const healthToneClass =
    health.tone === "acid"
      ? "border-acid/30 bg-acid/10 text-acid"
      : health.tone === "electric"
        ? "border-electric/30 bg-electric/10 text-electric"
        : "border-ember/30 bg-ember/10 text-ember";
  const customerSummary = [
    `Bu dönemde ${formatCurrency(data.summary.spend, data.summary.currency)} harcandı ve ${formatNumber(data.summary.results)} sonuç alındı.`,
    `Sonuç başı maliyet ${formatCurrency(health.costPerResult, data.summary.currency)}; hedef ${formatCurrency(
      customerGoals.maxCostPerResult,
      data.summary.currency
    )}.`,
    `Bütçe kullanımı yaklaşık %${formatNumber(health.budgetUsage * 100, 0)}, sonuç hedefi ilerlemesi %${formatNumber(
      health.resultProgress * 100,
      0
    )}.`,
    topRoas
      ? `Satış tarafında en iyi çalışan kampanya ${topRoas.campaignName}; ROAS ${formatRoas(topRoas.roas)}.`
      : topEfficiency
        ? `En çok hedef sonuç üreten kampanya ${topEfficiency.campaignName}; ${formatNumber(topEfficiency.results)} ${(
            topEfficiency.primaryResultLabel || "hedef sonuç"
          ).toLowerCase()}.`
        : "",
    alerts[0] ? `İlk bakılacak konu: ${alerts[0]}.` : "Şu an kritik bir uyarı görünmüyor; düzenli takip yeterli."
  ].filter(Boolean);

  function handleDateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onDateChange({
      datePreset: String(form.get("datePreset") || "last_30d"),
      dateFrom: String(form.get("dateFrom") || ""),
      dateTo: String(form.get("dateTo") || "")
    });
  }

  function handleGoalsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onCustomerGoalsChange({
      monthlyBudget: Math.max(0, Number(form.get("monthlyBudget")) || 0),
      targetResults: Math.max(0, Number(form.get("targetResults")) || 0),
      maxCostPerResult: Math.max(0, Number(form.get("maxCostPerResult")) || 0)
    });
    setGoalNotice("Hedef kaydedildi. Panel skoru ve müşteri özeti artık bu hedeflere göre hesaplanır.");
    window.setTimeout(() => setGoalNotice(""), 3500);
  }

  async function openInterventionAnalysis() {
    const localBrief = buildInterventionBrief(data, customerGoals).join("\n");
    setInterventionAnalysis(localBrief);
    setIsInterventionOpen(true);

    try {
      await runAiTask("Müşterinin anlayacağı dilde müdahale analizi hazırlanıyor.", async () => {
        const response = await fetch("/api/panel-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message:
              "Bu Meta Ads hesabı için müşterinin anlayacağı sade Türkçeyle müdahale analizi yaz. Satış kampanyalarını, trafik/profil ziyareti kampanyalarını, mesaj ve lead kampanyalarını ayrı değerlendir. Önce ne oluyor, sonra neden önemli, sonra hangi sırayla müdahale edilmeli yaz. Gereksiz teknik jargon kullanma.",
            metrics: data.summary,
            campaigns: data.campaigns,
            customerGoals,
            localBrief
          })
        });
        const result = (await response.json()) as { answer?: string };
        setInterventionAnalysis(result.answer || localBrief);
      });
    } catch {
      setInterventionAnalysis(localBrief);
    }
  }

  return (
    <div id="ozet" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Performans özeti</p>
          <h2 className="mt-2 text-2xl font-black text-white">Hesap genel görünümü</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-fog-400">
            Son 30 günlük Meta Ads performansını tek ekranda okuyun; büyüme, maliyet ve verimlilik
            sinyallerini hızlıca yakalayın.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="inline-flex w-fit rounded-lg border border-acid/20 bg-acid/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-acid">
            Canlı Meta verisi
          </span>
          <button className="button-secondary px-4" type="button" onClick={onRefresh} disabled={isLoadingData}>
            {isLoadingData ? "Yenileniyor..." : "Veriyi Yenile"}
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {dataError ? (
        <div className="mt-4 rounded-lg border border-ember/25 bg-ember/10 p-4 text-sm leading-7 text-fog-200">
          {dataError}
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-white/10 bg-carbon-950/60 p-4 text-sm leading-7 text-fog-300">
        <strong className="text-white">{data.account.name || data.account.id || "Meta reklam hesabı"}</strong>{" "}
        için {datePresetLabel[data.datePreset] || data.datePreset} verisi. Son çekim:{" "}
        {new Date(data.fetchedAt).toLocaleString("tr-TR")}.
      </div>

      <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0 rounded-lg border border-white/10 bg-carbon-950 p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="flex size-32 shrink-0 items-center justify-center rounded-full p-2"
              style={{
                background: `conic-gradient(#b7ff3c ${health.score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`
              }}
            >
              <div className="flex size-full items-center justify-center rounded-full bg-carbon-950 text-3xl font-black text-white">
                {health.score}
              </div>
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => void openInterventionAnalysis()}
                className={`inline-flex max-w-full rounded-lg border px-3 py-2 text-left text-xs font-black uppercase tracking-[0.12em] transition hover:bg-white/5 ${healthToneClass}`}
              >
                {health.label}
              </button>
              <h3 className="mt-4 text-xl font-black text-white">Reklam durumu</h3>
              <p className="mt-2 text-sm leading-7 text-fog-300">{health.message}</p>
              <p className="mt-2 text-xs font-semibold text-fog-500">
                {health.riskSignals} kampanya risk sinyali, {formatNumber(data.summary.results)} toplam sonuç.
              </p>
            </div>
          </div>
        </div>

        <form className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-carbon-950 p-5" onSubmit={handleGoalsSubmit}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-acid">Müşteri hedefleri</p>
              <h3 className="mt-2 text-xl font-black text-white">Hedefe göre takip</h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-fog-400">
                Bu alan panelin reklam skorunu müşterinin gerçek bütçe, sonuç ve maliyet hedeflerine göre okumasını sağlar.
              </p>
            </div>
            <button className="button-secondary w-full justify-center px-4 sm:w-auto" type="submit">
              Kaydet
              <CheckCircle2 className="size-4" />
            </button>
          </div>
          <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-3">
            <label className="grid min-w-0 gap-2 text-xs font-bold uppercase tracking-[0.08em] text-fog-400">
              Aylık bütçe
              <input
                name="monthlyBudget"
                type="number"
                min="0"
                step="100"
                defaultValue={customerGoals.monthlyBudget}
                className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-carbon-900 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="grid min-w-0 gap-2 text-xs font-bold uppercase tracking-[0.08em] text-fog-400">
              Sonuç hedefi
              <input
                name="targetResults"
                type="number"
                min="0"
                step="1"
                defaultValue={customerGoals.targetResults}
                className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-carbon-900 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="grid min-w-0 gap-2 text-xs font-bold uppercase tracking-[0.08em] text-fog-400">
              Maks. sonuç maliyeti
              <input
                name="maxCostPerResult"
                type="number"
                min="0"
                step="10"
                defaultValue={customerGoals.maxCostPerResult}
                className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-carbon-900 px-3 py-2 text-sm text-white"
              />
            </label>
          </div>
          {goalNotice ? (
            <div className="mt-4 rounded-lg border border-acid/25 bg-acid/10 px-4 py-3 text-sm font-semibold text-fog-100">
              {goalNotice}
            </div>
          ) : null}
        </form>
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center gap-3">
          <FileText className="size-5 text-acid" />
          <h3 className="text-lg font-black text-white">Müşteri özeti</h3>
        </div>
        <div className="mt-4 grid gap-2 text-sm leading-7 text-fog-300">
          {customerSummary.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>

      <form className="mt-5 grid gap-4 rounded-lg border border-white/10 bg-carbon-950/60 p-4 lg:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={handleDateSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Tarih aralığı
          <select name="datePreset" className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" defaultValue={dateFilter.datePreset}>
            {Object.entries(datePresetLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Başlangıç
          <input name="dateFrom" type="date" defaultValue={dateFilter.dateFrom} className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Bitiş
          <input name="dateTo" type="date" defaultValue={dateFilter.dateTo} className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
        </label>
        <div className="flex items-end">
          <button className="button-primary" type="submit" disabled={isLoadingData}>
            Uygula
            <CalendarDays className="size-4" />
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-white/10 bg-carbon-950 p-5">
            <div className={`inline-flex rounded-lg px-3 py-2 text-xs font-bold ${metricToneClass[metric.tone]}`}>
              {metric.trend}
            </div>
            <p className="mt-5 text-sm font-semibold text-fog-400">{metric.label}</p>
            <h3 className="mt-2 text-3xl font-black text-white">{metric.value}</h3>
            <p className="mt-2 text-sm text-fog-500">{metric.helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "En çok harcama", value: topSpend?.campaignName || "-", helper: topSpend ? formatCurrency(topSpend.spend, data.summary.currency) : "Veri yok" },
          { title: "En yüksek ROAS", value: topRoas?.campaignName || "-", helper: topRoas ? formatRoas(topRoas.roas) : "Veri yok" },
          { title: "En düşük CTR", value: worstCtr?.campaignName || "-", helper: worstCtr ? formatPercent(worstCtr.ctr) : "Veri yok" },
          { title: "En yüksek CPC", value: highestCpc?.campaignName || "-", helper: highestCpc ? formatCurrency(highestCpc.cpc, data.summary.currency) : "Veri yok" }
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-acid">{item.title}</p>
            <h3 className="mt-3 text-base font-black text-white">{item.value}</h3>
            <p className="mt-2 text-sm text-fog-400">{item.helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-white/10 bg-carbon-950/60 p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="size-5 text-ember" />
          <h3 className="text-lg font-black text-white">Bilinmesi gereken ince sinyaller</h3>
        </div>
        <div className="mt-4 grid gap-2 text-sm leading-7 text-fog-300">
          {alerts.length > 0 ? (
            alerts.map((alert) => <p key={alert}>• {alert}</p>)
          ) : (
            <p>Kritik düşük CTR, yüksek CPC, sıfır sonuç veya düşük ROAS uyarısı görünmüyor.</p>
          )}
        </div>
      </div>
      {isInterventionOpen ? (
        <InterventionAnalysisDialog
          title="Müdahale analizi"
          text={interventionAnalysis}
          onClose={() => setIsInterventionOpen(false)}
        />
      ) : null}
    </div>
  );
}

function InterventionAnalysisDialog({
  title,
  text,
  onClose
}: {
  title: string;
  text: string;
  onClose: () => void;
}) {
  const paragraphs = text
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-carbon-950/75 p-4 backdrop-blur-md">
      <div className="max-h-[86vh] w-full max-w-2xl overflow-auto rounded-lg border border-white/10 bg-carbon-900 p-5 shadow-glow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ember">AI müdahale önerisi</p>
            <h3 className="mt-2 text-2xl font-black text-white">{title}</h3>
          </div>
          <button className="button-ghost px-3" type="button" onClick={onClose} aria-label="Popup kapat">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-3 text-sm leading-7 text-fog-200">
          {paragraphs.length > 0 ? paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : <p>Analiz hazırlanıyor...</p>}
        </div>
        <div className="mt-5 rounded-lg border border-ember/25 bg-ember/10 p-4 text-sm leading-7 text-fog-200">
          Meta üzerinde işlem yapmadan önce kampanya hedefi, bütçe ve kreatif notlarını kontrol edin. Panel, uygulama adımından önce ayrıca onay ister.
        </div>
      </div>
    </div>
  );
}

function CampaignTableModule({
  connection,
  data,
  dateFilter,
  onRefresh,
  onReport
}: {
  connection: MetaConnectionState;
  data: MetaInsightsData;
  dateFilter: DateFilter;
  onRefresh: () => void;
  onReport: (report: MetaActionReport) => void;
}) {
  const [openCampaignId, setOpenCampaignId] = useState("");
  const [detail, setDetail] = useState<MetaCampaignDetailData | null>(null);
  const [detailError, setDetailError] = useState("");
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [statusExplanation, setStatusExplanation] = useState<MetaCampaignInsight | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<{ kind: DetailEntityKind; row: DetailEntityRow } | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    delivery: "all",
    type: "all",
    minSpend: "",
    maxSpend: "",
    sortBy: "spend_desc"
  });
  const [pendingAction, setPendingAction] = useState<{
    action: "update_campaign_status";
    entityId: string;
    entityName: string;
    status: "ACTIVE" | "PAUSED";
  } | null>(null);
  const campaignTypes = useMemo(() => {
    const unique = new Map<string, string>();
    data.campaigns.forEach((campaign) => {
      unique.set(campaign.campaignType, campaign.campaignTypeLabel || campaign.campaignType);
    });
    return Array.from(unique.entries());
  }, [data.campaigns]);
  const filteredCampaigns = useMemo(() => {
    const minSpend = filters.minSpend ? Number(filters.minSpend) : undefined;
    const maxSpend = filters.maxSpend ? Number(filters.maxSpend) : undefined;
    const search = filters.search.trim().toLocaleLowerCase("tr-TR");

    return data.campaigns
      .filter((campaign) => {
        const matchesSearch =
          !search ||
          campaign.campaignName.toLocaleLowerCase("tr-TR").includes(search) ||
          (campaign.objective || "").toLocaleLowerCase("tr-TR").includes(search);
        const matchesStatus = filters.status === "all" || campaign.status === filters.status;
        const active = isCampaignDeliveryActive(campaign);
        const matchesDelivery =
          filters.delivery === "all" ||
          (filters.delivery === "active" && active) ||
          (filters.delivery === "paused" && !active);
        const matchesType = filters.type === "all" || campaign.campaignType === filters.type;
        const matchesMinSpend = minSpend === undefined || campaign.spend >= minSpend;
        const matchesMaxSpend = maxSpend === undefined || campaign.spend <= maxSpend;

        return matchesSearch && matchesStatus && matchesDelivery && matchesType && matchesMinSpend && matchesMaxSpend;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "spend_asc":
            return a.spend - b.spend;
          case "results_desc":
            return b.results - a.results;
          case "ctr_desc":
            return b.ctr - a.ctr;
          case "cpc_desc":
            return b.cpc - a.cpc;
          case "roas_desc":
            return b.roas - a.roas;
          default:
            return b.spend - a.spend;
        }
      });
  }, [data.campaigns, filters]);

  async function loadCampaignDetail(campaign: MetaCampaignInsight) {
    const nextOpen = openCampaignId === campaign.campaignId ? "" : campaign.campaignId;
    setOpenCampaignId(nextOpen);
    setDetail(null);
    setDetailError("");
    setSelectedEntity(null);

    if (!nextOpen) return;

    setIsDetailLoading(true);
    try {
      const response = await fetch("/api/meta-campaign-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: connection.accessToken,
          campaign,
          ...dateFilter
        })
      });
      const result = (await response.json()) as MetaCampaignDetailApiResponse;

      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.message || "Kampanya detayı alınamadı.");
      }

      setDetail(result.data);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Kampanya detayı alınamadı.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function applyCampaignStatus() {
    if (!pendingAction) return;

    const action = pendingAction;
    setPendingAction(null);

    try {
      const response = await fetch("/api/meta-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action.action,
          accessToken: connection.accessToken,
          entityId: action.entityId,
          status: action.status
        })
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Meta kampanya durumu güncellenemedi.");
      }

      onReport(
        createReport({
          title: "Kampanya durumu güncellendi",
          status: "success",
          actionType: action.action,
          entityName: action.entityName,
          entityId: action.entityId,
          message: `${action.entityName} kampanyası ${action.status} durumuna alındı.`
        })
      );
      onRefresh();
    } catch (error) {
      onReport(
        createReport({
          title: "Kampanya müdahale hatası",
          status: "error",
          actionType: action.action,
          entityName: action.entityName,
          entityId: action.entityId,
          message: error instanceof Error ? error.message : "Meta kampanya durumu güncellenemedi."
        })
      );
    }
  }

  return (
    <div id="kampanyalar" className="surface scroll-mt-28 overflow-hidden rounded-lg">
      <div className="border-b border-white/10 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Kampanyalar</p>
        <h2 className="mt-2 text-2xl font-black text-white">Performans tablosu</h2>
        <p className="mt-3 text-sm leading-7 text-fog-400">
          {data.account.name || "Bağlı reklam hesabı"} için canlı kampanya insight verilerini karşılaştırın.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl gap-3 border-b border-white/10 bg-carbon-950/45 p-4 md:grid-cols-2 xl:grid-cols-7">
        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.1em] text-fog-400 xl:col-span-2">
          Kampanya ara
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-3 py-2 text-sm normal-case tracking-normal text-white placeholder:text-fog-500"
            placeholder="Ad veya objective"
          />
        </label>
        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.1em] text-fog-400">
          Panel durumu
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-3 py-2 text-sm normal-case tracking-normal text-white"
          >
            <option value="all">Tümü</option>
            <option value="Güçlü">Güçlü</option>
            <option value="İncele">İncele</option>
            <option value="Riskli">Riskli</option>
          </select>
        </label>
        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.1em] text-fog-400">
          Yayın durumu
          <select
            value={filters.delivery}
            onChange={(event) => setFilters((current) => ({ ...current, delivery: event.target.value }))}
            className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-3 py-2 text-sm normal-case tracking-normal text-white"
          >
            <option value="all">Tümü</option>
            <option value="active">Açık / aktif</option>
            <option value="paused">Kapalı / pasif</option>
          </select>
        </label>
        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.1em] text-fog-400">
          Reklam türü
          <select
            value={filters.type}
            onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
            className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-3 py-2 text-sm normal-case tracking-normal text-white"
          >
            <option value="all">Tümü</option>
            {campaignTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.1em] text-fog-400">
          Sıralama
          <select
            value={filters.sortBy}
            onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))}
            className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-3 py-2 text-sm normal-case tracking-normal text-white"
          >
            <option value="spend_desc">Harcama yüksek</option>
            <option value="spend_asc">Harcama düşük</option>
            <option value="results_desc">Sonuç yüksek</option>
            <option value="ctr_desc">CTR yüksek</option>
            <option value="cpc_desc">CPC yüksek</option>
            <option value="roas_desc">ROAS yüksek</option>
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2 xl:col-span-7">
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.1em] text-fog-400">
            Min. harcama
            <input
              value={filters.minSpend}
              onChange={(event) => setFilters((current) => ({ ...current, minSpend: event.target.value }))}
              type="number"
              min="0"
              className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-3 py-2 text-sm normal-case tracking-normal text-white"
            />
          </label>
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.1em] text-fog-400">
            Maks. harcama
            <input
              value={filters.maxSpend}
              onChange={(event) => setFilters((current) => ({ ...current, maxSpend: event.target.value }))}
              type="number"
              min="0"
              className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-3 py-2 text-sm normal-case tracking-normal text-white"
            />
          </label>
        </div>
        <div className="flex items-end xl:col-span-7">
          <button
            className="button-ghost px-4"
            type="button"
            onClick={() =>
              setFilters({
                search: "",
                status: "all",
                delivery: "all",
                type: "all",
                minSpend: "",
                maxSpend: "",
                sortBy: "spend_desc"
              })
            }
          >
            Filtreleri Temizle
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.12em] text-fog-500">
            <tr>
              <th className="px-5 py-4">Kampanya</th>
              <th className="px-5 py-4">Tür</th>
              <th className="px-5 py-4">Harcama</th>
              <th className="px-5 py-4">Gösterim</th>
              <th className="px-5 py-4">Tıklama</th>
              <th className="px-5 py-4">CTR</th>
              <th className="px-5 py-4">CPC</th>
              <th className="px-5 py-4">CPM</th>
              <th className="px-5 py-4">Hedef sonuç</th>
              <th className="px-5 py-4">ROAS</th>
              <th className="px-5 py-4">Durum</th>
              <th className="px-5 py-4">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-fog-300">
            {filteredCampaigns.length > 0 ? (
              filteredCampaigns.map((campaign) => (
                <Fragment key={campaign.campaignId}>
                  <tr>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{campaign.campaignName}</p>
                      <p className="mt-1 text-xs text-fog-500">
                        {campaign.deliveryStatus || "status yok"} {campaign.objective ? `• ${campaign.objective}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-fog-200">
                        {campaign.campaignTypeLabel || "Diğer"}
                      </span>
                    </td>
                    <td className="px-5 py-4">{formatCurrency(campaign.spend, data.summary.currency)}</td>
                    <td className="px-5 py-4">{formatNumber(campaign.impressions)}</td>
                    <td className="px-5 py-4">{formatNumber(campaign.clicks)}</td>
                    <td className="px-5 py-4">{formatPercent(campaign.ctr)}</td>
                    <td className="px-5 py-4">{formatCurrency(campaign.cpc, data.summary.currency)}</td>
                    <td className="px-5 py-4">{formatCurrency(campaign.cpm, data.summary.currency)}</td>
                    <td className="px-5 py-4">
                      <p>{formatNumber(campaign.results)}</p>
                      <p className="mt-1 text-xs text-fog-500">{campaign.primaryResultLabel || "Hedef sonuç"}</p>
                    </td>
                    <td className="px-5 py-4">{campaign.campaignType === "sales" ? formatRoas(campaign.roas) : "-"}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setStatusExplanation(campaign)}
                        className={`rounded-lg border px-3 py-1 text-xs font-bold transition hover:bg-white/5 ${campaignStatusClass[campaign.status]}`}
                      >
                        {campaign.status}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="button-ghost px-2 py-1 text-xs" type="button" onClick={() => void loadCampaignDetail(campaign)}>
                          Detay
                          <MousePointerClick className="size-3.5" />
                        </button>
                        <button
                          className="button-ghost px-2 py-1 text-xs text-ember"
                          type="button"
                          onClick={() =>
                            setPendingAction({
                              action: "update_campaign_status",
                              entityId: campaign.campaignId,
                              entityName: campaign.campaignName,
                              status: "PAUSED"
                            })
                          }
                        >
                          Durdur
                          <PauseCircle className="size-3.5" />
                        </button>
                        <button
                          className="button-ghost px-2 py-1 text-xs text-acid"
                          type="button"
                          onClick={() =>
                            setPendingAction({
                              action: "update_campaign_status",
                              entityId: campaign.campaignId,
                              entityName: campaign.campaignName,
                              status: "ACTIVE"
                            })
                          }
                        >
                          Aktifleştir
                          <PlayCircle className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {openCampaignId === campaign.campaignId ? (
                    <tr key={`${campaign.campaignId}-detail`}>
                      <td colSpan={12} className="bg-carbon-950/70 px-5 py-5">
                        {isDetailLoading ? (
                          <p className="text-sm text-fog-400">Kampanya detayı yükleniyor...</p>
                        ) : detailError ? (
                          <p className="text-sm text-ember">{detailError}</p>
                        ) : detail ? (
                          <div className="grid gap-5">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                              {[
                                { label: "Ad set", value: String(detail.adsets.length) },
                                { label: "Reklam", value: String(detail.ads.length) },
                                { label: "Detay çekim", value: new Date(detail.fetchedAt).toLocaleString("tr-TR") },
                                { label: "Campaign ID", value: detail.campaign.campaignId }
                              ].map((item) => (
                                <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-fog-500">{item.label}</p>
                                  <p className="mt-2 break-words text-sm font-bold text-white">{item.value}</p>
                                </div>
                              ))}
                            </div>
                            <div className="grid gap-4 xl:grid-cols-2">
                              <MiniInsightTable
                                title="Ad set detayları"
                                rows={detail.adsets}
                                currency={data.summary.currency}
                                onRowClick={(row) => setSelectedEntity({ kind: "adset", row })}
                              />
                              <MiniInsightTable
                                title="Reklam detayları"
                                rows={detail.ads}
                                currency={data.summary.currency}
                                onRowClick={(row) => setSelectedEntity({ kind: "ad", row })}
                              />
                            </div>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            ) : (
              <tr>
                <td className="px-5 py-8 text-center text-fog-400" colSpan={12}>
                  Seçili filtrelere göre kampanya bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {statusExplanation ? (
        <StatusExplanationDialog
          campaign={statusExplanation}
          currency={data.summary.currency}
          onClose={() => setStatusExplanation(null)}
        />
      ) : null}
      {selectedEntity ? (
        <EntityInsightDialog
          kind={selectedEntity.kind}
          row={selectedEntity.row}
          currency={data.summary.currency}
          onClose={() => setSelectedEntity(null)}
        />
      ) : null}
      {pendingAction ? (
        <ConfirmDialog
          title="Bu müdahaleyi uygulamak istediğine emin misin?"
          text={`${pendingAction.entityName} kampanyası Meta üzerinde ${pendingAction.status} durumuna alınacak.`}
          confirmLabel="Evet, uygula"
          onCancel={() => setPendingAction(null)}
          onConfirm={() => void applyCampaignStatus()}
        />
      ) : null}
    </div>
  );
}

function StatusExplanationDialog({
  campaign,
  currency,
  onClose
}: {
  campaign: MetaCampaignInsight;
  currency?: string;
  onClose: () => void;
}) {
  const notes = getCampaignStatusExplanation(campaign, currency);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-carbon-950/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-lg border border-white/10 bg-carbon-900 p-5 shadow-glow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Durum açıklaması</p>
            <h3 className="mt-2 text-xl font-black text-white">{campaign.campaignName}</h3>
            <p className="mt-2 text-sm text-fog-400">
              {campaign.campaignTypeLabel} • {campaign.primaryResultLabel || "Hedef sonuç"}
            </p>
          </div>
          <button className="button-ghost px-3" type="button" onClick={onClose} aria-label="Açıklamayı kapat">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-3">
          <span className={`w-fit rounded-lg border px-3 py-1 text-xs font-bold ${campaignStatusClass[campaign.status]}`}>
            {campaign.status}
          </span>
          <div className="grid gap-2 text-sm leading-7 text-fog-200">
            {notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EntityInsightDialog({
  kind,
  row,
  currency,
  onClose
}: {
  kind: DetailEntityKind;
  row: DetailEntityRow;
  currency?: string;
  onClose: () => void;
}) {
  const notes = buildEntityEvaluation(row, currency);
  const resultLabel = row.primaryResultLabel || "Hedef sonuç";
  const title = kind === "adset" ? "Ad set değerlendirmesi" : "Reklam değerlendirmesi";
  const previewUrl = row.previewUrl || row.imageUrl || row.thumbnailUrl;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-carbon-950/75 p-4 backdrop-blur-md">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-lg border border-white/10 bg-carbon-900 p-5 shadow-glow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">{title}</p>
            <h3 className="mt-2 text-xl font-black text-white">{row.name}</h3>
            <p className="mt-2 text-sm text-fog-400">{row.deliveryStatus || row.id}</p>
          </div>
          <button className="button-ghost px-3" type="button" onClick={onClose} aria-label="Detayı kapat">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-white/10 bg-carbon-950 p-4">
            <h4 className="text-base font-black text-white">Veri akışı</h4>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                { label: "Harcama", value: formatCurrency(row.spend, currency) },
                { label: "Gösterim", value: formatNumber(row.impressions) },
                { label: "Tıklama", value: formatNumber(row.clicks) },
                { label: resultLabel, value: formatNumber(row.results) }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
                  <span className="text-fog-400">{item.label}</span>
                  <strong className="text-white">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-carbon-950 p-4">
            <h4 className="text-base font-black text-white">Durum yorumu</h4>
            <div className="mt-4 grid gap-2 text-sm leading-7 text-fog-200">
              {notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </div>
        </div>

        {kind === "ad" ? (
          <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-carbon-950">
            <div className="border-b border-white/10 p-4">
              <h4 className="text-base font-black text-white">Reklam önizleme</h4>
              {row.creativeName ? <p className="mt-1 text-sm text-fog-400">{row.creativeName}</p> : null}
            </div>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={`${row.name} reklam önizleme`} className="max-h-[420px] w-full object-contain" />
            ) : (
              <div className="grid min-h-52 place-items-center p-6 text-center text-sm leading-7 text-fog-400">
                Meta bu reklam için görsel/video önizleme URL'i döndürmedi.
                {row.videoId ? ` Video ID: ${row.videoId}` : ""}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MiniInsightTable({
  title,
  rows,
  currency,
  onRowClick
}: {
  title: string;
  rows: DetailEntityRow[];
  currency?: string;
  onRowClick?: (row: DetailEntityRow) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-carbon-900/80">
      <div className="border-b border-white/10 p-4">
        <h4 className="text-base font-black text-white">{title}</h4>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-white/[0.04] uppercase tracking-[0.12em] text-fog-500">
            <tr>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Harcama</th>
              <th className="px-4 py-3">CTR</th>
              <th className="px-4 py-3">CPC</th>
              <th className="px-4 py-3">Sonuç</th>
              <th className="px-4 py-3">ROAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-fog-300">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={onRowClick ? "cursor-pointer transition hover:bg-white/[0.04]" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-left font-bold text-white transition hover:text-acid"
                      onClick={() => onRowClick?.(row)}
                    >
                      {row.name}
                    </button>
                    <p className="mt-1 text-fog-500">{row.deliveryStatus || row.id}</p>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(row.spend, currency)}</td>
                  <td className="px-4 py-3">{formatPercent(row.ctr)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.cpc, currency)}</td>
                  <td className="px-4 py-3">
                    <p>{formatNumber(row.results)}</p>
                    {row.primaryResultLabel ? <p className="mt-1 text-fog-500">{row.primaryResultLabel}</p> : null}
                  </td>
                  <td className="px-4 py-3">{formatRoas(row.roas)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-fog-500">
                  Bu seviyede veri bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  text,
  confirmLabel,
  onCancel,
  onConfirm
}: {
  title: string;
  text: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-carbon-950/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-carbon-900 p-5 shadow-glow">
        <h3 className="text-xl font-black text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-fog-300">{text}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button className="button-secondary" type="button" onClick={onCancel}>
            Vazgeç
          </button>
          <button className="button-primary" type="button" onClick={onConfirm}>
            {confirmLabel}
            <CheckCircle2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PanelChat({
  data,
  runAiTask
}: {
  data: MetaInsightsData;
  runAiTask: <T>(label: string, task: () => Promise<T>) => Promise<T>;
}) {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState(buildLocalAnalysis(data));
  const [isLoading, setIsLoading] = useState(false);

  const payload = useMemo(
    () => ({
      metrics: data.summary,
      campaigns: data.campaigns
    }),
    [data]
  );

  useEffect(() => {
    setAnswer(buildLocalAnalysis(data));
  }, [data]);

  async function askAI(prompt: string) {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;

    setMessage(cleanPrompt);
    setIsLoading(true);

    try {
      await runAiTask("AI Chat canlı kampanya verisine göre yanıt hazırlıyor.", async () => {
      const response = await fetch("/api/panel-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanPrompt, ...payload })
      });
      const data = (await response.json()) as { answer?: string };
      setAnswer(data.answer || fallbackAnswer);
      });
    } catch {
      setAnswer(fallbackAnswer);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAI(message);
  }

  return (
    <div id="ai-chat" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">AI Chat</p>
          <h2 className="mt-2 text-2xl font-black text-white">Reklam hesabına soru sor</h2>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-acid/12 text-acid">
          <Sparkles className="size-5" />
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-carbon-950 p-4 text-sm leading-7 text-fog-300">
        {isLoading ? "AI yanıtı hazırlanıyor..." : answer}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 text-left text-xs font-semibold text-fog-300 transition hover:border-acid/50 hover:text-white"
            type="button"
            onClick={() => void askAI(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <input
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Örn: Hangi kampanyaya bütçe artırmalıyım?"
        />
        <button className="button-primary" type="submit">
          Sor
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

export function MetaConnectionCard({
  connection,
  data,
  isLoadingData,
  dataError,
  onConnected,
  onDisconnected,
  onRefresh
}: {
  connection: MetaConnectionState | null;
  data: MetaInsightsData | null;
  isLoadingData: boolean;
  dataError: string;
  onConnected: (connection: MetaConnectionState) => void;
  onDisconnected: () => void;
  onRefresh: () => void;
}) {
  const [showToken, setShowToken] = useState(false);
  const [connectionResult, setConnectionResult] = useState<MetaConnectionResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const accessToken = String(form.get("accessToken") || "");
    const adAccountId = String(form.get("adAccountId") || "");

    setIsChecking(true);
    setConnectionResult(null);

    try {
      const response = await fetch("/api/meta-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, adAccountId })
      });
      const data = (await response.json()) as MetaConnectionResult;
      setConnectionResult(data);

      if (response.ok && data.ok && data.account) {
        onConnected({
          accessToken,
          adAccountId,
          account: data.account,
          connectedAt: new Date().toISOString()
        });
      }
    } catch {
      setConnectionResult({
        ok: false,
        message: "Bağlantı isteği gönderilemedi. Dev server ve internet bağlantısını kontrol edin."
      });
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div id="meta-baglanti" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Meta bağlantısı</p>
          <h2 className="mt-2 text-2xl font-black text-white">Reklam hesabı bağlantısı</h2>
          <p className="mt-3 text-sm leading-7 text-fog-400">
            Meta access token ve reklam hesabı ID alanı burada yer alır. Güvenlik için bu önizleme
            sürümünde token kalıcı olarak kaydedilmez; canlı sistemde backend tarafında şifreli saklama önerilir.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-electric/25 bg-electric/10 px-3 py-2 text-xs font-bold text-electric">
          <ShieldCheck className="size-4" />
          Güvenli kurulum alanı
        </div>
      </div>

      {connection ? (
        <div className="mt-6 rounded-lg border border-acid/25 bg-acid/10 p-4 text-sm leading-7 text-fog-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-bold text-white">Meta bağlantısı aktif.</p>
              <p className="mt-1">
                {connection.account.name || connection.account.id || "Reklam hesabı"} bağlı. Token bu oturumda tutulur,
                sayfa yenilenirse yeniden girmeniz gerekir.
              </p>
              {data ? (
                <p className="mt-1 text-fog-300">
                  Canlı veri: {data.summary.campaignCount} kampanya, son çekim{" "}
                  {new Date(data.fetchedAt).toLocaleString("tr-TR")}.
                </p>
              ) : null}
              {dataError ? <p className="mt-2 text-ember">{dataError}</p> : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button className="button-secondary" type="button" onClick={onRefresh} disabled={isLoadingData}>
                {isLoadingData ? "Yenileniyor..." : "Canlı Veriyi Yenile"}
                <RefreshCw className="size-4" />
              </button>
              <button className="button-secondary" type="button" onClick={onDisconnected}>
                Bağlantıyı Sıfırla
                <Unplug className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <form className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto]" onSubmit={handleSubmit}>
        <label className="grid min-w-0 gap-2 text-sm font-semibold text-fog-100">
          Meta Access Token
          <div className="flex min-w-0 overflow-hidden rounded-lg border border-white/10 bg-carbon-950">
            <input
              name="accessToken"
              className="min-h-12 min-w-0 flex-1 bg-transparent px-4 py-3 text-white placeholder:text-fog-500"
              type={showToken ? "text" : "password"}
              placeholder="EAAB..."
              autoComplete="off"
              required
            />
            <button
              className="flex w-12 shrink-0 items-center justify-center text-fog-400 transition hover:text-acid"
              type="button"
              onClick={() => setShowToken((value) => !value)}
              aria-label={showToken ? "Tokenı gizle" : "Tokenı göster"}
            >
              {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>

        <label className="grid min-w-0 gap-2 text-sm font-semibold text-fog-100">
          Reklam Hesabı ID
          <input
            name="adAccountId"
            className="min-h-12 min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
            placeholder="act_123456789"
            autoComplete="off"
            required
          />
        </label>

        <div className="flex items-end">
          <button className="button-primary" type="submit" disabled={isChecking}>
            {isChecking ? "Kontrol Ediliyor..." : "Bağlantıyı Kontrol Et"}
          </button>
        </div>
      </form>

      {connectionResult ? (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm leading-7 ${
            connectionResult.ok
              ? "border-acid/25 bg-acid/10 text-fog-100"
              : "border-ember/25 bg-ember/10 text-fog-200"
          }`}
        >
          <p className="font-bold text-white">{connectionResult.message}</p>
          {connectionResult.account ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <span>
                <strong className="text-fog-100">Hesap:</strong> {connectionResult.account.name}
              </span>
              <span>
                <strong className="text-fog-100">ID:</strong> {connectionResult.account.id}
              </span>
              <span>
                <strong className="text-fog-100">Durum:</strong> {connectionResult.account.status}
              </span>
              <span>
                <strong className="text-fog-100">Para birimi:</strong> {connectionResult.account.currency || "-"}
              </span>
            </div>
          ) : null}
          {!connectionResult.ok && connectionResult.code ? (
            <p className="mt-2 text-xs text-fog-400">Meta hata kodu: {connectionResult.code}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CampaignCreatorCard({
  connection,
  data,
  onRefresh,
  onReport
}: {
  connection: MetaConnectionState;
  data: MetaInsightsData;
  onRefresh: () => void;
  onReport: (report: MetaActionReport) => void;
}) {
  const [summary, setSummary] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("campaignName") || "Yeni Meta kampanyası");
    const objective = String(form.get("objective") || "Satış");
    const budget = String(form.get("budget") || "Belirtilmedi");
    const audience = String(form.get("audience") || "Geniş hedef kitle");
    const status = String(form.get("status") || "PAUSED") as "ACTIVE" | "PAUSED";

    setIsCreating(true);
    setSummary("");

    try {
      const response = await fetch("/api/meta-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_campaign",
          accessToken: connection.accessToken,
          adAccountId: connection.adAccountId,
          campaignName: name,
          objective,
          status
        })
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; id?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Kampanya oluşturulamadı.");
      }

      const message = `${connection.account.name || "Bağlı Meta hesabı"} üzerinde ${name} kampanyası oluşturuldu. Campaign ID: ${result.id}. Günlük bütçe/ad set/reklam katmanı için sonraki kurulum akışı ayrıca bağlanmalı. Girilen bütçe notu: ${budget}, hedef kitle: ${audience}.`;
      setSummary(message);
      onReport(
        createReport({
          title: "Kampanya oluşturuldu",
          status: "success",
          actionType: "create_campaign",
          entityName: name,
          entityId: result.id,
          message,
          details: [`Objective: ${objective}`, `Status: ${status}`, `Bütçe notu: ${budget}`, `Hedef kitle: ${audience}`]
        })
      );
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kampanya oluşturulamadı.";
      setSummary(message);
      onReport(
        createReport({
          title: "Kampanya oluşturma hatası",
          status: "error",
          actionType: "create_campaign",
          entityName: name,
          message
        })
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div id="kampanya-olustur" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Kampanya oluştur</p>
          <h2 className="mt-2 text-2xl font-black text-white">Meta kampanya taslağı</h2>
          <p className="mt-3 text-sm leading-7 text-fog-400">
            Bu modül artık Meta hesabında gerçek kampanya oluşturur. Güvenli başlangıç için varsayılan durum
            PAUSED gelir; ACTIVE seçersen kampanya aktif statüyle gönderilir.
          </p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-electric/12 text-electric">
          <Rocket className="size-5" />
        </span>
      </div>

      <div className="mt-5 grid gap-4 rounded-lg border border-white/10 bg-carbon-950/60 p-4 text-sm leading-7 text-fog-300 sm:grid-cols-3">
        <span>
          <strong className="text-white">Hesap:</strong> {data.account.name || data.account.id}
        </span>
        <span>
          <strong className="text-white">Canlı kampanya:</strong> {data.summary.campaignCount}
        </span>
        <span>
          <strong className="text-white">Son 30 gün harcama:</strong>{" "}
          {formatCurrency(data.summary.spend, data.summary.currency)}
        </span>
      </div>

      <form className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Kampanya Adı
          <input
            name="campaignName"
            className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
            placeholder="Örn: Mayıs Satış Kampanyası"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Kampanya Hedefi
          <select
            name="objective"
            className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white"
            defaultValue="Satış"
          >
            <option>Satış</option>
            <option>Lead toplama</option>
            <option>Trafik</option>
            <option>Marka bilinirliği</option>
            <option>Mesaj / WhatsApp</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Meta Durumu
          <select
            name="status"
            className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white"
            defaultValue="PAUSED"
          >
            <option value="PAUSED">PAUSED - Güvenli taslak</option>
            <option value="ACTIVE">ACTIVE - Aktif oluştur</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Günlük Bütçe
          <input
            name="budget"
            className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
            placeholder="Örn: 1.500 TL"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Hedef Kitle
          <input
            name="audience"
            className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
            placeholder="Örn: 25-44, e-ticaret ilgisi, İstanbul"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100 lg:col-span-2">
          Teklif / Mesaj
          <textarea
            name="offer"
            className="min-h-28 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
            placeholder="Kampanyanın teklifini, ürününü veya ana mesajını yazın."
          />
        </label>
        <div className="lg:col-span-2">
          <button className="button-primary" type="submit" disabled={isCreating}>
            {isCreating ? "Meta'da Oluşturuluyor..." : "Meta'da Kampanya Oluştur"}
            <Rocket className="size-4" />
          </button>
        </div>
      </form>

      {summary ? (
        <div className="mt-5 rounded-lg border border-electric/25 bg-electric/10 p-4 text-sm leading-7 text-fog-200">
          {summary}
        </div>
      ) : null}
    </div>
  );
}

export function CreativeGeneratorCard({
  data,
  runAiTask
}: {
  data: MetaInsightsData;
  runAiTask: <T>(label: string, task: () => Promise<T>) => Promise<T>;
}) {
  const [creative, setCreative] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product = String(form.get("product") || "ürün / hizmet");
    const audience = String(form.get("audience") || "hedef kitle");
    const format = String(form.get("format") || "Reels / Story");
    const weakestCtr = [...data.campaigns].filter((campaign) => campaign.ctr > 0).sort((a, b) => a.ctr - b.ctr)[0];
    const topRoas = [...data.campaigns].sort((a, b) => b.roas - a.roas)[0];

    const brief = `AI kreatif briefi: ${product} için ${audience} kitlesine yönelik ${format} formatında ilk 3 saniyede problem/istek gösterilmeli. Canlı hesaptaki sinyal: ${
        weakestCtr
          ? `${weakestCtr.campaignName} kampanyasında CTR ${formatPercent(weakestCtr.ctr)}, bu yüzden ilk karede fayda ve teklif daha net olmalı.`
          : "Düşük CTR sinyali yok, mevcut öğrenmelerden teklif netliği korunmalı."
      } ${
        topRoas && topRoas.roas > 0 ? `ROAS tarafında ${topRoas.campaignName} güçlü görünüyor; bu kampanyadaki mesaj açısı varyasyon olarak denenebilir.` : ""
      } Başlık: "Daha fazla satış için reklamlarınızı veriye göre yönetin." Metin: "Aky Dijital, Meta kampanyalarınızı analiz eder, kreatif açıları test eder ve bütçenizi dönüşüme bağlar." CTA: "Ücretsiz strateji görüşmesi al."`;

    setCreative(brief);
    setImageError("");
    setImageUrl("");

    await runAiTask("AI kreatif görseli üretiliyor, önizleme hazırlanıyor.", async () => {
      const response = await fetch("/api/creative-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          audience,
          format,
          brief,
          campaignContext: {
            summary: data.summary,
            topCampaigns: data.campaigns.slice(0, 5)
          }
        })
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; imageUrl?: string };

      if (!result.ok || !result.imageUrl) {
        setImageError(result.message || "AI görseli üretilemedi.");
        return;
      }

      setImageUrl(result.imageUrl);
    });
  }

  return (
    <div id="kreatif-olustur" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">AI kreatif oluştur</p>
          <h2 className="mt-2 text-2xl font-black text-white">Kreatif brief ve reklam metni</h2>
          <p className="mt-3 text-sm leading-7 text-fog-400">
            Reklam kreatifi için açı, başlık, metin ve CTA önerisini bağlı reklam hesabındaki CTR, CPC ve ROAS
            sinyallerine göre hızlıca üretin.
          </p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-acid/12 text-acid">
          <WandSparkles className="size-5" />
        </span>
      </div>

      <form className="mt-6 grid gap-4 lg:grid-cols-3" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Ürün / Hizmet
          <input
            name="product"
            className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
            placeholder="Örn: Klinik randevu, e-ticaret ürünü"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Hedef Kitle
          <input
            name="audience"
            className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
            placeholder="Örn: Yerel işletme sahipleri"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Format
          <select
            name="format"
            className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white"
            defaultValue="Reels / Story"
          >
            <option>Reels / Story</option>
            <option>Feed görsel</option>
            <option>Carousel</option>
            <option>Video reklam</option>
          </select>
        </label>
        <div className="lg:col-span-3">
          <button className="button-primary" type="submit">
            AI Kreatif Briefi Üret
            <Sparkles className="size-4" />
          </button>
        </div>
      </form>

      {creative ? (
        <div className="mt-5 rounded-lg border border-acid/25 bg-acid/10 p-4 text-sm leading-7 text-fog-200">
          {creative}
        </div>
      ) : null}
      {imageError ? (
        <div className="mt-5 rounded-lg border border-ember/25 bg-ember/10 p-4 text-sm leading-7 text-fog-200">
          {imageError}
        </div>
      ) : null}
      {imageUrl ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-carbon-950">
          <div className="flex items-center gap-3 border-b border-white/10 p-4">
            <ImageIcon className="size-5 text-acid" />
            <h3 className="text-lg font-black text-white">Görsel önizleme</h3>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="AI kreatif önizleme" className="h-auto w-full" />
        </div>
      ) : null}
    </div>
  );
}

export function AiAnalysisCenter({
  data,
  runAiTask
}: {
  data: MetaInsightsData;
  runAiTask: <T>(label: string, task: () => Promise<T>) => Promise<T>;
}) {
  const [analysis, setAnalysis] = useState(buildLocalAnalysis(data));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAnalysis(buildLocalAnalysis(data));
  }, [data]);

  async function refreshAnalysis() {
    setIsLoading(true);
    try {
      await runAiTask("Canlı Meta verileri yorumlanıyor ve aksiyon önerileri çıkarılıyor.", async () => {
      const response = await fetch("/api/panel-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Bu Meta Ads hesabı için yönetici özeti, riskler ve 3 aksiyon önerisi üret.",
          metrics: data.summary,
          campaigns: data.campaigns
        })
      });
      const result = (await response.json()) as { answer?: string };
      setAnalysis(result.answer || buildLocalAnalysis(data));
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div id="ai-analiz" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">AI destekli analiz</p>
          <h2 className="mt-2 text-2xl font-black text-white">Yönetici özeti ve aksiyon önerileri</h2>
          <p className="mt-3 text-sm leading-7 text-fog-400">
            Bağlı reklam hesabından çekilen canlı kampanya verilerini sade bir özet, risk yorumu ve uygulanabilir
            optimizasyon maddelerine çevirin.
          </p>
        </div>
        <button className="button-primary" type="button" onClick={() => void refreshAnalysis()}>
          {isLoading ? "Analiz hazırlanıyor..." : "AI Analizi Yenile"}
          <ClipboardList className="size-4" />
        </button>
      </div>
      <div className="mt-5 rounded-lg border border-white/10 bg-carbon-950 p-4 text-sm leading-7 text-fog-300">
        {analysis}
      </div>
    </div>
  );
}

export function OptimizationCenter({
  connection,
  data,
  reports,
  onRefresh,
  onReport,
  onReportUpdate,
  onReportDelete,
  runAiTask
}: {
  connection: MetaConnectionState;
  data: MetaInsightsData;
  reports: MetaActionReport[];
  onRefresh: () => void;
  onReport: (report: MetaActionReport) => void;
  onReportUpdate: (reportId: string, patch: Partial<Pick<MetaActionReport, "title" | "message" | "details">>) => void;
  onReportDelete: (reportId: string) => void;
  runAiTask: <T>(label: string, task: () => Promise<T>) => Promise<T>;
}) {
  const actions = buildOptimizationActions(data.campaigns);
  const [pendingAction, setPendingAction] = useState<MetaOptimizationAction | null>(null);
  const [aiNotes, setAiNotes] = useState("");
  const [editingReport, setEditingReport] = useState<{ id: string; message: string } | null>(null);
  const directActions = actions.filter((action) => action.executable).length;
  const noteActions = actions.length - directActions;

  async function generateOptimizationPlan() {
    await runAiTask("AI optimizasyon önerileri canlı reklam verisine göre hazırlanıyor.", async () => {
      const response = await fetch("/api/panel-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:
            "Bu Meta Ads hesabı için optimizasyon planı üret. Riskli kampanyalar, ölçekleme adayları, kreatif yenileme notları ve uygulama önceliği ver.",
          metrics: data.summary,
          campaigns: data.campaigns
        })
      });
      const result = (await response.json()) as { answer?: string };
      setAiNotes(result.answer || "AI optimizasyon notu üretilemedi.");
    });
  }

  async function applyOptimizationAction() {
    if (!pendingAction) return;

    const action = pendingAction;
    setPendingAction(null);

    if (!action.executable || !action.payload?.status) {
      onReport(
        createReport({
          title: "Optimizasyon notu kaydedildi",
          status: "success",
          actionType: action.type,
          entityName: action.campaignName,
          entityId: action.campaignId,
          message: `${action.title}: ${action.impact}`,
          details: [action.reason]
        })
      );
      return;
    }

    try {
      const response = await fetch("/api/meta-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_campaign_status",
          accessToken: connection.accessToken,
          entityId: action.campaignId,
          status: action.payload.status
        })
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Optimizasyon uygulanamadı.");
      }

      onReport(
        createReport({
          title: "AI optimizasyon uygulandı",
          status: "success",
          actionType: action.type,
          entityName: action.campaignName,
          entityId: action.campaignId,
          message: `${action.campaignName} için ${action.impact} aksiyonu uygulandı.`,
          details: [action.reason, `Yeni durum: ${action.payload.status}`]
        })
      );
      onRefresh();
    } catch (error) {
      onReport(
        createReport({
          title: "AI optimizasyon hatası",
          status: "error",
          actionType: action.type,
          entityName: action.campaignName,
          entityId: action.campaignId,
          message: error instanceof Error ? error.message : "Optimizasyon uygulanamadı.",
          details: [action.reason]
        })
      );
    }
  }

  return (
    <div id="optimizasyon" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Optimizasyon merkezi</p>
          <h2 className="mt-2 text-2xl font-black text-white">Müşteri aksiyon merkezi</h2>
          <p className="mt-3 text-sm leading-7 text-fog-400">
            Canlı Meta verisine göre neyin güvenle yapılabileceğini, neyin sadece not olarak takip edilmesi gerektiğini sade şekilde görün.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="button-secondary" type="button" onClick={onRefresh}>
            Veriyi Yenile
            <RefreshCw className="size-4" />
          </button>
          <button className="button-primary" type="button" onClick={() => void generateOptimizationPlan()}>
            AI Plan Üret
            <Sparkles className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Uygulanabilir işlem", value: directActions, helper: "Onaydan sonra Meta'ya gider" },
          { label: "Takip notu", value: noteActions, helper: "Raporlara kaydedilir" },
          { label: "Kayıtlı rapor", value: reports.length, helper: "Son işlemler görünür" }
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-white/10 bg-carbon-950 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-fog-500">{item.label}</p>
            <h3 className="mt-2 text-2xl font-black text-white">{formatNumber(item.value)}</h3>
            <p className="mt-1 text-sm text-fog-400">{item.helper}</p>
          </div>
        ))}
      </div>
      {aiNotes ? (
        <div className="mt-5 rounded-lg border border-electric/25 bg-electric/10 p-4 text-sm leading-7 text-fog-200">
          {aiNotes}
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.length > 0 ? (
          actions.map((action) => {
            const Icon = action.executable ? PauseCircle : FileText;
            const actionLabel = getCustomerActionLabel(action);
            return (
              <div key={action.id} className="rounded-lg border border-white/10 bg-carbon-950 p-4">
                <Icon className={`size-5 ${action.executable ? "text-ember" : "text-acid"}`} />
                <h3 className="mt-4 text-base font-black text-white">{action.title}</h3>
                <p className="mt-2 text-sm font-semibold text-fog-200">{action.campaignName}</p>
                <p className="mt-2 text-sm leading-7 text-fog-400">{action.reason}</p>
                <p className="mt-2 text-sm leading-7 text-fog-300">{action.impact}</p>
                <button className="button-secondary mt-4 w-full" type="button" onClick={() => setPendingAction(action)}>
                  {actionLabel}
                </button>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-acid/25 bg-acid/10 p-4 text-sm leading-7 text-fog-200 md:col-span-2 xl:col-span-4">
            Canlı veride şu an kritik optimizasyon uyarısı görünmüyor. Yine de kreatif, kitle ve landing page testleri
            düzenli takip edilmeli.
          </div>
        )}
      </div>
      <div className="mt-5 rounded-lg border border-ember/25 bg-ember/10 p-4 text-sm leading-7 text-fog-200">
        Bu ekran müşterinin yanlışlıkla işlem yapmasını engellemek için Meta üzerinde değişiklikten önce mutlaka onay ister.
        Uygulanamayan öneriler işlem geçmişine not olarak kaydedilir.
      </div>
      <div className="mt-6 rounded-lg border border-white/10 bg-carbon-950/60 p-4">
        <div className="flex items-center gap-3">
          <History className="size-5 text-acid" />
          <h3 className="text-lg font-black text-white">Optimizasyon raporları</h3>
        </div>
        <div className="mt-4 grid gap-3">
          {reports.length > 0 ? (
            reports.map((report) => (
              <div key={report.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm leading-7">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-black text-white">{report.title}</p>
                  <span className={report.status === "success" ? "text-acid" : "text-ember"}>
                    {report.status === "success" ? "Başarılı" : "Hata"} • {new Date(report.createdAt).toLocaleString("tr-TR")}
                  </span>
                </div>
                <p className="mt-2 text-fog-300">{report.message}</p>
                {report.details?.length ? (
                  <div className="mt-2 grid gap-1 text-fog-500">
                    {report.details.map((detail) => (
                      <span key={detail}>• {detail}</span>
                    ))}
                  </div>
                ) : null}
                {editingReport?.id === report.id ? (
                  <div className="mt-4 grid gap-3">
                    <textarea
                      value={editingReport.message}
                      onChange={(event) => setEditingReport({ id: report.id, message: event.target.value })}
                      className="min-h-24 rounded-lg border border-white/10 bg-carbon-950 px-3 py-2 text-sm text-white"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        className="button-primary"
                        type="button"
                        onClick={() => {
                          onReportUpdate(report.id, { message: editingReport.message });
                          setEditingReport(null);
                        }}
                      >
                        Güncelle
                        <CheckCircle2 className="size-4" />
                      </button>
                      <button className="button-secondary" type="button" onClick={() => setEditingReport(null)}>
                        Vazgeç
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      className="button-secondary px-3 py-2 text-xs"
                      type="button"
                      onClick={() => setEditingReport({ id: report.id, message: report.message })}
                    >
                      Güncelle
                      <FileText className="size-4" />
                    </button>
                    <button className="button-ghost px-3 py-2 text-xs text-ember" type="button" onClick={() => onReportDelete(report.id)}>
                      Kaldır
                      <X className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm leading-7 text-fog-400">Henüz kayıtlı optimizasyon raporu yok.</p>
          )}
        </div>
      </div>
      {pendingAction ? (
        <ConfirmDialog
          title="AI önerisini uygulamak istediğine emin misin?"
          text={
            pendingAction.executable
              ? `${pendingAction.campaignName} kampanyasında "${pendingAction.impact}" aksiyonu Meta üzerinde uygulanacak.`
              : `${pendingAction.campaignName} için bu öneri raporlara not olarak kaydedilecek.`
          }
          confirmLabel={pendingAction.executable ? "Evet, uygula" : "Raporlara kaydet"}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => void applyOptimizationAction()}
        />
      ) : null}
    </div>
  );
}
