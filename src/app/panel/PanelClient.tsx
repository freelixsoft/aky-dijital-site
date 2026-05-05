"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  Gauge,
  LockKeyhole,
  LineChart,
  MessageSquareText,
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
import { FormEvent, useEffect, useMemo, useState } from "react";
import { quickPrompts } from "@/lib/panel";
import type {
  MetaAccountSnapshot,
  MetaCampaignInsight,
  MetaConnectionState,
  MetaInsightsApiResponse,
  MetaInsightsData
} from "@/lib/meta";

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

function buildLocalAnalysis(data: MetaInsightsData | null) {
  if (!data || data.campaigns.length === 0) {
    return "Canlı Meta verisi henüz yüklenmedi. Meta bağlantısını kurup verileri yeniledikten sonra AI analiz bu hesaptaki kampanyalara göre hazırlanır.";
  }

  const topRoas = [...data.campaigns].sort((a, b) => b.roas - a.roas)[0];
  const highestCpc = [...data.campaigns].sort((a, b) => b.cpc - a.cpc)[0];
  const lowCtr = data.campaigns.find((campaign) => campaign.ctr > 0 && campaign.ctr < 1);

  return [
    `Canlı ön analiz: ${data.summary.campaignCount} kampanyada toplam harcama ${formatCurrency(
      data.summary.spend,
      data.summary.currency
    )}, ortalama CTR ${formatPercent(data.summary.ctr)} ve ROAS ${formatRoas(data.summary.roas)}.`,
    topRoas ? `En güçlü kampanya: ${topRoas.campaignName} (${formatRoas(topRoas.roas)} ROAS).` : "",
    highestCpc && highestCpc.cpc > 0
      ? `En pahalı tıklama: ${highestCpc.campaignName} (${formatCurrency(highestCpc.cpc, data.summary.currency)} CPC).`
      : "",
    lowCtr ? `Düşük ilgi sinyali: ${lowCtr.campaignName} kampanyasında CTR ${formatPercent(lowCtr.ctr)}.` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function buildOptimizationActions(campaigns: MetaCampaignInsight[]) {
  return campaigns.flatMap((campaign) => {
    const actions: Array<{
      icon: LucideIcon;
      title: string;
      text: string;
      tone: "acid" | "electric" | "ember" | "pulse";
    }> = [];

    if (campaign.spend > 0 && campaign.results <= 0 && campaign.ctr > 0 && campaign.ctr < 1) {
      actions.push({
        icon: AlertCircle,
        title: "Durdurma adayı",
        text: `${campaign.campaignName}: harcama var, sonuç yok ve CTR ${formatPercent(campaign.ctr)}. Kreatif veya kitle yenilenene kadar bütçe kesilmeli.`,
        tone: "ember"
      });
    }

    if (campaign.roas >= 3) {
      actions.push({
        icon: LineChart,
        title: "Ölçekleme fırsatı",
        text: `${campaign.campaignName}: ${formatRoas(campaign.roas)} ROAS ile güçlü. Bütçe artışı kontrollü test edilebilir.`,
        tone: "acid"
      });
    }

    if (campaign.cpc > 20) {
      actions.push({
        icon: Gauge,
        title: "Yüksek CPC",
        text: `${campaign.campaignName}: CPC ${formatCurrency(campaign.cpc)} seviyesinde. İlk aksiyon kreatif ve teklif mesajı testi olmalı.`,
        tone: "pulse"
      });
    }

    if (campaign.roas > 0 && campaign.roas < 1.5) {
      actions.push({
        icon: SlidersHorizontal,
        title: "Verimlilik riski",
        text: `${campaign.campaignName}: ROAS ${formatRoas(campaign.roas)}. Bütçe dağılımı, hedefleme ve landing page uyumu tekrar incelenmeli.`,
        tone: "electric"
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
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [gateMessage, setGateMessage] = useState("Önce Meta bağlantısını kurunuz. Bağlantı kurulunca diğer modüller canlı reklam verisiyle açılır.");
  const activeModuleMeta = panelWorkspaceModules.find((module) => module.id === activeModule);
  const isConnected = Boolean(connection);

  async function refreshMetaData(targetConnection = connection) {
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
          datePreset: "last_30d"
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

  return (
    <div id="panel-moduller" className="scroll-mt-28">
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
              isLoadingData={isLoadingData}
              dataError={dataError}
              onConnected={handleConnected}
              onDisconnected={handleDisconnect}
              onRefresh={() => void refreshMetaData()}
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
    </div>
  );
}

type ActivePanelModuleProps = {
  activeModule: PanelModuleId;
  connection: MetaConnectionState | null;
  data: MetaInsightsData | null;
  isLoadingData: boolean;
  dataError: string;
  onConnected: (connection: MetaConnectionState) => void;
  onDisconnected: () => void;
  onRefresh: () => void;
};

function ActivePanelModule({
  activeModule,
  connection,
  data,
  isLoadingData,
  dataError,
  onConnected,
  onDisconnected,
  onRefresh
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
      return <SummaryModule data={data} isLoadingData={isLoadingData} dataError={dataError} onRefresh={onRefresh} />;
    case "kampanya":
      return <CampaignCreatorCard connection={connection} data={data} />;
    case "kreatif":
      return <CreativeGeneratorCard data={data} />;
    case "analiz":
      return <AiAnalysisCenter data={data} />;
    case "optimizasyon":
      return <OptimizationCenter data={data} onRefresh={onRefresh} />;
    case "kampanyalar":
      return <CampaignTableModule data={data} />;
    case "chat":
      return <PanelChat data={data} />;
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

function SummaryModule({
  data,
  isLoadingData,
  dataError,
  onRefresh
}: {
  data: MetaInsightsData;
  isLoadingData: boolean;
  dataError: string;
  onRefresh: () => void;
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
    </div>
  );
}

function CampaignTableModule({ data }: { data: MetaInsightsData }) {
  return (
    <div id="kampanyalar" className="surface scroll-mt-28 overflow-hidden rounded-lg">
      <div className="border-b border-white/10 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Kampanyalar</p>
        <h2 className="mt-2 text-2xl font-black text-white">Performans tablosu</h2>
        <p className="mt-3 text-sm leading-7 text-fog-400">
          {data.account.name || "Bağlı reklam hesabı"} için canlı kampanya insight verilerini karşılaştırın.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.12em] text-fog-500">
            <tr>
              <th className="px-5 py-4">Kampanya</th>
              <th className="px-5 py-4">Harcama</th>
              <th className="px-5 py-4">Gösterim</th>
              <th className="px-5 py-4">Tıklama</th>
              <th className="px-5 py-4">CTR</th>
              <th className="px-5 py-4">CPC</th>
              <th className="px-5 py-4">CPM</th>
              <th className="px-5 py-4">Sonuç</th>
              <th className="px-5 py-4">ROAS</th>
              <th className="px-5 py-4">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-fog-300">
            {data.campaigns.length > 0 ? (
              data.campaigns.map((campaign) => (
                <tr key={campaign.campaignId}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white">{campaign.campaignName}</p>
                    <p className="mt-1 text-xs text-fog-500">
                      {campaign.deliveryStatus || "status yok"} {campaign.objective ? `• ${campaign.objective}` : ""}
                    </p>
                  </td>
                  <td className="px-5 py-4">{formatCurrency(campaign.spend, data.summary.currency)}</td>
                  <td className="px-5 py-4">{formatNumber(campaign.impressions)}</td>
                  <td className="px-5 py-4">{formatNumber(campaign.clicks)}</td>
                  <td className="px-5 py-4">{formatPercent(campaign.ctr)}</td>
                  <td className="px-5 py-4">{formatCurrency(campaign.cpc, data.summary.currency)}</td>
                  <td className="px-5 py-4">{formatCurrency(campaign.cpm, data.summary.currency)}</td>
                  <td className="px-5 py-4">{formatNumber(campaign.results)}</td>
                  <td className="px-5 py-4">{formatRoas(campaign.roas)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-lg border px-3 py-1 text-xs font-bold ${campaignStatusClass[campaign.status]}`}>
                      {campaign.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-8 text-center text-fog-400" colSpan={10}>
                  Bu tarih aralığında kampanya insight verisi bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PanelChat({ data }: { data: MetaInsightsData }) {
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
      const response = await fetch("/api/panel-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanPrompt, ...payload })
      });
      const data = (await response.json()) as { answer?: string };
      setAnswer(data.answer || fallbackAnswer);
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
  data
}: {
  connection: MetaConnectionState;
  data: MetaInsightsData;
}) {
  const [summary, setSummary] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("campaignName") || "Yeni Meta kampanyası");
    const objective = String(form.get("objective") || "Satış");
    const budget = String(form.get("budget") || "Belirtilmedi");
    const audience = String(form.get("audience") || "Geniş hedef kitle");

    setSummary(
      `${connection.account.name || "Bağlı Meta hesabı"} üzerinde ${name} için ${objective.toLowerCase()} hedefli kampanya taslağı hazır. Günlük bütçe ${budget}, ilk hedef kitle "${audience}". Yayın öncesi piksel/olay takibi, kreatif açıları ve landing page uyumu kontrol edilmeli.`
    );
  }

  return (
    <div id="kampanya-olustur" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Kampanya oluştur</p>
          <h2 className="mt-2 text-2xl font-black text-white">Meta kampanya taslağı</h2>
          <p className="mt-3 text-sm leading-7 text-fog-400">
            Kampanya taslağı bağlı reklam hesabındaki mevcut performans verisiyle birlikte hazırlanır. Bu ekranda
            yayınlama yapılmaz; canlı hesaba gönderilecek aksiyon ayrıca onaylı kurulum akışı ister.
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
          <button className="button-primary" type="submit">
            Kampanya Taslağı Oluştur
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

export function CreativeGeneratorCard({ data }: { data: MetaInsightsData }) {
  const [creative, setCreative] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product = String(form.get("product") || "ürün / hizmet");
    const audience = String(form.get("audience") || "hedef kitle");
    const format = String(form.get("format") || "Reels / Story");
    const weakestCtr = [...data.campaigns].filter((campaign) => campaign.ctr > 0).sort((a, b) => a.ctr - b.ctr)[0];
    const topRoas = [...data.campaigns].sort((a, b) => b.roas - a.roas)[0];

    setCreative(
      `AI kreatif briefi: ${product} için ${audience} kitlesine yönelik ${format} formatında ilk 3 saniyede problem/istek gösterilmeli. Canlı hesaptaki sinyal: ${
        weakestCtr
          ? `${weakestCtr.campaignName} kampanyasında CTR ${formatPercent(weakestCtr.ctr)}, bu yüzden ilk karede fayda ve teklif daha net olmalı.`
          : "Düşük CTR sinyali yok, mevcut öğrenmelerden teklif netliği korunmalı."
      } ${
        topRoas && topRoas.roas > 0 ? `ROAS tarafında ${topRoas.campaignName} güçlü görünüyor; bu kampanyadaki mesaj açısı varyasyon olarak denenebilir.` : ""
      } Başlık: "Daha fazla satış için reklamlarınızı veriye göre yönetin." Metin: "Aky Dijital, Meta kampanyalarınızı analiz eder, kreatif açıları test eder ve bütçenizi dönüşüme bağlar." CTA: "Ücretsiz strateji görüşmesi al."`
    );
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
    </div>
  );
}

export function AiAnalysisCenter({ data }: { data: MetaInsightsData }) {
  const [analysis, setAnalysis] = useState(buildLocalAnalysis(data));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAnalysis(buildLocalAnalysis(data));
  }, [data]);

  async function refreshAnalysis() {
    setIsLoading(true);
    try {
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
  data,
  onRefresh
}: {
  data: MetaInsightsData;
  onRefresh: () => void;
}) {
  const actions = buildOptimizationActions(data.campaigns);

  return (
    <div id="optimizasyon" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Optimizasyon merkezi</p>
          <h2 className="mt-2 text-2xl font-black text-white">Öncelikli aksiyonlar</h2>
          <p className="mt-3 text-sm leading-7 text-fog-400">
            Canlı Meta verisine göre riskli, izlenecek ve ölçeklenecek kampanyaları önceliklendirin.
          </p>
        </div>
        <button className="button-secondary" type="button" onClick={onRefresh}>
          Veriyi Yenile
          <RefreshCw className="size-4" />
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.length > 0 ? (
          actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div key={`${action.title}-${index}`} className="rounded-lg border border-white/10 bg-carbon-950 p-4">
              <Icon className={`size-5 ${action.tone === "ember" ? "text-ember" : action.tone === "pulse" ? "text-pulse" : action.tone === "electric" ? "text-electric" : "text-acid"}`} />
              <h3 className="mt-4 text-base font-black text-white">{action.title}</h3>
              <p className="mt-2 text-sm leading-7 text-fog-400">{action.text}</p>
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
        Bu ekran canlı veriden öneri üretir. Kampanya durdurma, bütçe değiştirme veya yayınlama gibi işlemler ayrıca
        seçmeli onay adımıyla bağlanmalıdır.
      </div>
    </div>
  );
}
