"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  Gauge,
  LineChart,
  MessageSquareText,
  Rocket,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
  X,
  type LucideIcon
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { panelActions, panelCampaigns, panelMetrics, quickPrompts } from "@/lib/panel";

const fallbackAnswer =
  "AI ön analizi: En güçlü alan remarketing ve Advantage+ kampanyaları. Soğuk kitle kreatif testinde CTR düşük ve CPC yüksek görünüyor. İlk aksiyon olarak düşük CTR kampanyada kreatif açısını yenileyin, remarketing bütçesini kontrollü artırın ve ROAS düşük kampanyalarda hedef kitleyi yeniden segmentleyin.";

type MetaConnectionResult = {
  ok: boolean;
  message: string;
  code?: number;
  type?: string;
  account?: {
    id?: string;
    name?: string;
    status?: string;
    currency?: string;
    timezone?: string;
    amountSpent?: string;
    balance?: string;
  };
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
  const activeModuleMeta = panelWorkspaceModules.find((module) => module.id === activeModule);

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

      <div className="mx-auto mt-8 grid max-w-6xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {panelWorkspaceModules.map((module, index) => {
          const Icon = module.icon;
          const isActive = module.id === activeModule;

          return (
            <motion.button
              key={module.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.035 }}
              whileHover={{ y: -4 }}
              onClick={() => setActiveModule((current) => (current === module.id ? null : module.id))}
              className={`group flex min-h-[11rem] w-full flex-col items-start justify-between rounded-lg border p-4 text-left transition ${
                isActive
                  ? `${workspaceAccentClass[module.accent]} shadow-glow`
                  : "border-white/10 bg-white/[0.045] text-fog-300 hover:border-acid/35 hover:bg-white/[0.07]"
              }`}
              aria-pressed={isActive}
            >
              <span className="flex w-full items-start justify-between gap-3">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-lg border ${
                    isActive ? workspaceAccentClass[module.accent] : "border-white/10 bg-carbon-950 text-acid"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="rounded-full border border-white/10 bg-carbon-950/70 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-fog-500">
                  {isActive ? "Açık" : "Aç"}
                </span>
              </span>
              <span>
                <span className="block text-lg font-black text-white">{module.title}</span>
                <span className="mt-2 block text-sm leading-6 text-fog-400">{module.description}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-acid">
                {isActive ? "Kapat" : "Modülü aç"}
                <ChevronRight className={`size-4 transition ${isActive ? "rotate-90" : "group-hover:translate-x-1"}`} />
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
            <ActivePanelModule activeModule={activeModuleMeta.id} />
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
              Şu anda açık bir panel detayı yok. Başlamak için yukarıdaki modüllerden birini seçin.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActivePanelModule({ activeModule }: { activeModule: PanelModuleId }) {
  switch (activeModule) {
    case "ozet":
      return <SummaryModule />;
    case "meta":
      return <MetaConnectionCard />;
    case "kampanya":
      return <CampaignCreatorCard />;
    case "kreatif":
      return <CreativeGeneratorCard />;
    case "analiz":
      return <AiAnalysisCenter />;
    case "optimizasyon":
      return <OptimizationCenter />;
    case "kampanyalar":
      return <CampaignTableModule />;
    case "chat":
      return <PanelChat />;
    default:
      return null;
  }
}

function SummaryModule() {
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
        <span className="inline-flex w-fit rounded-lg border border-acid/20 bg-acid/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-acid">
          Demo veri
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {panelMetrics.map((metric) => (
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

function CampaignTableModule() {
  return (
    <div id="kampanyalar" className="surface scroll-mt-28 overflow-hidden rounded-lg">
      <div className="border-b border-white/10 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Kampanyalar</p>
        <h2 className="mt-2 text-2xl font-black text-white">Performans tablosu</h2>
        <p className="mt-3 text-sm leading-7 text-fog-400">
          Aktif kampanyaların harcama, sonuç ve ROAS durumunu karşılaştırın.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.12em] text-fog-500">
            <tr>
              <th className="px-5 py-4">Kampanya</th>
              <th className="px-5 py-4">Harcama</th>
              <th className="px-5 py-4">CTR</th>
              <th className="px-5 py-4">CPC</th>
              <th className="px-5 py-4">Sonuç</th>
              <th className="px-5 py-4">ROAS</th>
              <th className="px-5 py-4">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-fog-300">
            {panelCampaigns.map((campaign) => (
              <tr key={campaign.name}>
                <td className="px-5 py-4 font-semibold text-white">{campaign.name}</td>
                <td className="px-5 py-4">{campaign.spend}</td>
                <td className="px-5 py-4">{campaign.ctr}</td>
                <td className="px-5 py-4">{campaign.cpc}</td>
                <td className="px-5 py-4">{campaign.result}</td>
                <td className="px-5 py-4">{campaign.roas}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-lg border px-3 py-1 text-xs font-bold ${campaignStatusClass[campaign.status]}`}>
                    {campaign.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PanelChat() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState(fallbackAnswer);
  const [isLoading, setIsLoading] = useState(false);

  const payload = useMemo(
    () => ({
      metrics: panelMetrics,
      campaigns: panelCampaigns
    }),
    []
  );

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

export function MetaConnectionCard() {
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

export function CampaignCreatorCard() {
  const [summary, setSummary] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("campaignName") || "Yeni Meta kampanyası");
    const objective = String(form.get("objective") || "Satış");
    const budget = String(form.get("budget") || "Belirtilmedi");
    const audience = String(form.get("audience") || "Geniş hedef kitle");

    setSummary(
      `${name} için ${objective.toLowerCase()} hedefli kampanya taslağı hazır. Günlük bütçe ${budget}, ilk hedef kitle "${audience}". Yayın öncesi piksel/olay takibi, kreatif açıları ve landing page uyumu kontrol edilmeli.`
    );
  }

  return (
    <div id="kampanya-olustur" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Kampanya oluştur</p>
          <h2 className="mt-2 text-2xl font-black text-white">Meta kampanya taslağı</h2>
          <p className="mt-3 text-sm leading-7 text-fog-400">
            Eski paneldeki kampanya oluşturma akışı burada yayın öncesi taslak ve kontrol listesi olarak hazırlandı.
          </p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-electric/12 text-electric">
          <Rocket className="size-5" />
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

export function CreativeGeneratorCard() {
  const [creative, setCreative] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product = String(form.get("product") || "ürün / hizmet");
    const audience = String(form.get("audience") || "hedef kitle");
    const format = String(form.get("format") || "Reels / Story");

    setCreative(
      `AI kreatif briefi: ${product} için ${audience} kitlesine yönelik ${format} formatında ilk 3 saniyede problem/istek gösterilmeli. Başlık: "Daha fazla satış için reklamlarınızı veriye göre yönetin." Metin: "Aky Dijital, Meta kampanyalarınızı analiz eder, kreatif açıları test eder ve bütçenizi dönüşüme bağlar." CTA: "Ücretsiz strateji görüşmesi al."`
    );
  }

  return (
    <div id="kreatif-olustur" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">AI kreatif oluştur</p>
          <h2 className="mt-2 text-2xl font-black text-white">Kreatif brief ve reklam metni</h2>
          <p className="mt-3 text-sm leading-7 text-fog-400">
            Reklam kreatifi için açı, başlık, metin ve CTA önerisini hızlıca üretin.
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

export function AiAnalysisCenter() {
  const [analysis, setAnalysis] = useState(
    "AI analiz hazır: En güçlü kampanya ROAS üreten remarketing akışı. Soğuk kitle kreatif testinde CTR düşük ve CPC yüksek. Öncelik kreatif yenileme, bütçe yeniden dağıtımı ve landing page dönüşüm kontrolü olmalı."
  );
  const [isLoading, setIsLoading] = useState(false);

  async function refreshAnalysis() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/panel-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Bu Meta Ads hesabı için yönetici özeti, riskler ve 3 aksiyon önerisi üret.",
          metrics: panelMetrics,
          campaigns: panelCampaigns
        })
      });
      const data = (await response.json()) as { answer?: string };
      setAnalysis(data.answer || analysis);
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
            Kampanya verilerini sade bir özet, risk yorumu ve uygulanabilir optimizasyon maddelerine çevirin.
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

export function OptimizationCenter() {
  return (
    <div id="optimizasyon" className="surface scroll-mt-28 rounded-lg p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Optimizasyon merkezi</p>
          <h2 className="mt-2 text-2xl font-black text-white">Öncelikli aksiyonlar</h2>
          <p className="mt-3 text-sm leading-7 text-fog-400">
            Eski paneldeki AI optimizasyon akışı burada onay öncesi öneri merkezi olarak sunulur.
          </p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-ember/12 text-ember">
          <SlidersHorizontal className="size-5" />
        </span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {panelActions.map((action) => {
          const Icon = action.icon;
          return (
            <div key={action.title} className="rounded-lg border border-white/10 bg-carbon-950 p-4">
              <Icon className="size-5 text-acid" />
              <h3 className="mt-4 text-base font-black text-white">{action.title}</h3>
              <p className="mt-2 text-sm leading-7 text-fog-400">{action.text}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded-lg border border-ember/25 bg-ember/10 p-4 text-sm leading-7 text-fog-200">
        Gerçek kampanya durdurma, bütçe değiştirme veya yayınlama aksiyonları canlı sistemde ayrıca
        onay adımıyla çalıştırılmalıdır.
      </div>
    </div>
  );
}
