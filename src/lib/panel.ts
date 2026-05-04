import {
  BarChart3,
  Bot,
  Brush,
  ClipboardList,
  Gauge,
  LineChart,
  MessageSquareText,
  PauseCircle,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  WandSparkles,
  type LucideIcon
} from "lucide-react";

export type PanelMetric = {
  label: string;
  value: string;
  helper: string;
  trend: string;
  tone: "electric" | "acid" | "ember" | "pulse";
};

export type PanelCampaign = {
  name: string;
  spend: string;
  ctr: string;
  cpc: string;
  result: string;
  roas: string;
  status: "Güçlü" | "İncele" | "Riskli";
};

export type PanelFeature = {
  icon: LucideIcon;
  title: string;
  text: string;
};

export const panelFeatures: PanelFeature[] = [
  {
    icon: BarChart3,
    title: "Canlı performans özeti",
    text: "Harcama, gösterim, CTR, CPC, sonuç ve ROAS metriklerini tek ekranda takip edin."
  },
  {
    icon: Bot,
    title: "AI analiz ve yorum",
    text: "Kampanya performansını Türkçe yönetici özeti ve aksiyon önerileriyle yorumlatın."
  },
  {
    icon: Target,
    title: "Optimizasyon merkezi",
    text: "Durdurulacak, izlenecek ve ölçeklenecek kampanyaları net önceliklerle görün."
  },
  {
    icon: Brush,
    title: "AI kreatif üretimi",
    text: "Reklam kreatifleri için mesaj, açı ve görsel üretim akışlarını tek panelde yönetin."
  }
];

export const panelMetrics: PanelMetric[] = [
  {
    label: "Toplam Harcama",
    value: "₺128.450",
    helper: "Son 30 gün",
    trend: "+18,4%",
    tone: "electric"
  },
  {
    label: "Ortalama CTR",
    value: "%2,84",
    helper: "Tüm kampanyalar",
    trend: "+0,6 puan",
    tone: "acid"
  },
  {
    label: "Ortalama CPC",
    value: "₺6,12",
    helper: "Tıklama maliyeti",
    trend: "-12,1%",
    tone: "pulse"
  },
  {
    label: "ROAS",
    value: "4,38x",
    helper: "Gelir / reklam harcaması",
    trend: "+22,7%",
    tone: "ember"
  }
];

export const panelCampaigns: PanelCampaign[] = [
  {
    name: "E-ticaret Dönüşüm | Advantage+",
    spend: "₺42.800",
    ctr: "%3,42",
    cpc: "₺5,18",
    result: "812 satış",
    roas: "5,21x",
    status: "Güçlü"
  },
  {
    name: "Remarketing | Sepet Terk",
    spend: "₺18.950",
    ctr: "%4,18",
    cpc: "₺4,02",
    result: "326 satış",
    roas: "7,64x",
    status: "Güçlü"
  },
  {
    name: "Soğuk Kitle | Kreatif Test",
    spend: "₺31.200",
    ctr: "%0,86",
    cpc: "₺13,70",
    result: "98 lead",
    roas: "1,18x",
    status: "Riskli"
  },
  {
    name: "Video View | TikTok Benzeri Açı",
    spend: "₺12.400",
    ctr: "%1,24",
    cpc: "₺8,90",
    result: "241 etkileşim",
    roas: "2,10x",
    status: "İncele"
  }
];

export const panelActions = [
  {
    icon: PauseCircle,
    title: "Riskli kampanya",
    text: "Soğuk kitle kreatif testinde CTR düşük, CPC yüksek. Yeni kreatif açısı veya bütçe düşürme önerilir."
  },
  {
    icon: TrendingUp,
    title: "Ölçekleme fırsatı",
    text: "Sepet terk kampanyası güçlü ROAS üretiyor. Bütçe artışı kontrollü test edilebilir."
  },
  {
    icon: Sparkles,
    title: "Kreatif önerisi",
    text: "En iyi performans veren kreatiflerde ürün faydası ilk 3 saniyede daha net görünüyor."
  },
  {
    icon: ShieldCheck,
    title: "Rapor notu",
    text: "Aylık müşteri raporunda CTR düşüşü ve ROAS artışı birlikte yorumlanmalı."
  }
];

export const quickPrompts = [
  "Bu hesapta en büyük problem ne görünüyor?",
  "Hangi kampanyaya bütçe artırmalıyım?",
  "Hangi kampanyaları durdurmayı düşünmeliyim?",
  "Kreatif tarafında ilk neyi test etmeliyim?"
];

export const panelNavItems = [
  { label: "Özet", icon: Gauge, href: "#ozet" },
  { label: "Kampanya Oluştur", icon: Rocket, href: "#kampanya-olustur" },
  { label: "AI Kreatif", icon: WandSparkles, href: "#kreatif-olustur" },
  { label: "AI Analiz", icon: Sparkles, href: "#ai-analiz" },
  { label: "Optimizasyon", icon: SlidersHorizontal, href: "#optimizasyon" },
  { label: "Kampanyalar", icon: LineChart, href: "#kampanyalar" },
  { label: "AI Chat", icon: MessageSquareText, href: "#ai-chat" }
];

export const panelModuleCards = [
  {
    href: "#kampanya-olustur",
    icon: Rocket,
    title: "Kampanya Oluştur",
    text: "Hedef, bütçe, kitle ve teklif yapısını girerek yayın öncesi kampanya taslağı hazırlayın."
  },
  {
    href: "#kreatif-olustur",
    icon: WandSparkles,
    title: "AI Kreatif Oluştur",
    text: "Ürün, hedef kitle ve format bilgisine göre reklam metni ve kreatif brief üretin."
  },
  {
    href: "#ai-analiz",
    icon: ClipboardList,
    title: "AI Destekli Analiz",
    text: "Kampanya verilerini yönetici özeti, riskler ve net aksiyon önerileriyle yorumlatın."
  },
  {
    href: "#optimizasyon",
    icon: SlidersHorizontal,
    title: "Optimizasyon Merkezi",
    text: "Riskli, ölçeklenebilir ve incelenmesi gereken kampanyaları önceliklendirin."
  }
];
