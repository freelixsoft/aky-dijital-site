export type SubscriptionPlanId = "starter" | "growth" | "pro";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  priceUsd: number;
  adAccountLimit: number;
  badge: string;
  summary: string;
  features: string[];
};

export type SubscriptionState = {
  planId: SubscriptionPlanId;
  startedAt: string;
  expiresAt: string;
};

export type CustomerMembership = {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  website: string;
  sector: string;
  taxTitle: string;
  city: string;
  monthlyAdBudget: string;
  target: string;
  selectedPlanId: SubscriptionPlanId;
  createdAt: string;
  status: "active";
};

export type CustomerSession = {
  email: string;
  loggedInAt: string;
};

export const subscriptionStorageKey = "aky-panel-subscription";
export const membershipStorageKey = "aky-panel-membership";
export const memberSessionStorageKey = "aky-panel-member-session";
export const subscriptionCycleDays = 30;

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    priceUsd: 49,
    adAccountLimit: 2,
    badge: "Başlangıç",
    summary: "Küçük işletmelerin Meta reklamlarını düzenli takip etmesi için sade panel.",
    features: [
      "2 reklam hesabı bağlantısı",
      "Canlı Meta performans özeti",
      "Kampanya tablosu ve temel filtreler",
      "AI müşteri özeti ve müdahale analizi",
      "30 günlük panel erişimi"
    ]
  },
  {
    id: "growth",
    name: "Growth",
    priceUsd: 69,
    adAccountLimit: 4,
    badge: "En dengeli",
    summary: "Birden fazla hesap yöneten ekipler için daha geniş takip ve optimizasyon alanı.",
    features: [
      "4 reklam hesabı bağlantısı",
      "Ad set ve reklam detay değerlendirmeleri",
      "AI kreatif brief ve görsel önizleme akışı",
      "Optimizasyon raporu güncelleme ve kaldırma",
      "Öncelikli aksiyon merkezi"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 99,
    adAccountLimit: 6,
    badge: "Profesyonel",
    summary: "Yoğun reklam hesabı kullanan işletmeler için daha kapsamlı analiz ve kontrol.",
    features: [
      "6 reklam hesabı bağlantısı",
      "Gelişmiş AI analiz ve kampanya ayrımı",
      "Satış, trafik, mesaj ve lead kampanyalarını ayrı yorumlama",
      "Daha kapsamlı optimizasyon geçmişi",
      "Ajans paneline geçişe hazır yapı"
    ]
  }
];

export function getSubscriptionPlan(planId?: string) {
  return subscriptionPlans.find((plan) => plan.id === planId);
}

export function getSubscriptionDaysLeft(expiresAt?: string) {
  if (!expiresAt) return 0;

  const expires = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = expires - now;

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
