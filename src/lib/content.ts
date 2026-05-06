export type Service = {
  icon: string;
  title: string;
  short: string;
  fit: string;
  actions: string[];
  impact: string;
};

export const navItems = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Hizmetler", href: "/hizmetler" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "Sektörler", href: "/sektorler" },
  { label: "Blog", href: "/blog" },
  { label: "Abonelik", href: "/abonelik" },
  { label: "İletişim", href: "/iletisim" }
];

export const heroAlternatives = [
  "Aky Dijital ile reklam bütçenizi ölçülebilir büyümeye dönüştürün",
  "Markanızı dijitalde büyüten 360° pazarlama ajansı",
  "Meta, Google, TikTok ve SEO’da büyüme odaklı çözümler",
  "Reklam yatırımlarını satışa bağlayan yeni nesil dijital ekip",
  "KOBİ’ler ve markalar için performans odaklı dijital büyüme"
];

export const trustStats = [
  { value: "360°", label: "Dijital pazarlama danışmanlığı" },
  { value: "12+", label: "Büyüme ve performans hizmeti" },
  { value: "Haftalık", label: "Optimizasyon ve içgörü döngüsü" },
  { value: "Net", label: "Raporlama, hedef ve aksiyon planı" }
];

export const services: Service[] = [
  {
    icon: "Megaphone",
    title: "Meta Ads Yönetimi",
    short: "Instagram ve Facebook reklamlarını hedef, kreatif ve dönüşüm odağıyla yönetiriz.",
    fit: "Satış, lead, mağaza trafiği veya marka bilinirliği hedefleyen işletmeler için uygundur.",
    actions: ["Hedef kitle kurgusu", "Kampanya kurulumu", "Kreatif testleri", "Dönüşüm takibi"],
    impact: "Bütçeniz daha kontrollü kullanılır, doğru kitlelere ulaşır ve satış fırsatları artar."
  },
  {
    icon: "Search",
    title: "Google Ads Yönetimi",
    short: "Arama, Performance Max, YouTube ve görüntülü reklamları satın alma niyetine göre optimize ederiz.",
    fit: "Talebi hazır olan kullanıcıları yakalamak isteyen markalar, yerel işletmeler ve e-ticaret siteleri için uygundur.",
    actions: ["Anahtar kelime planı", "Reklam metni yazımı", "Teklif stratejisi", "Dönüşüm ölçümü"],
    impact: "Arama niyetini satışa çevirir, boşa harcanan tıklamaları azaltır ve daha net edinim maliyeti sağlar."
  },
  {
    icon: "Clapperboard",
    title: "TikTok Ads Yönetimi",
    short: "Dikkat çeken video kreatifleriyle TikTok’ta keşif ve satış odaklı kampanyalar kurarız.",
    fit: "Genç kitlelere ulaşmak, ürün keşfini hızlandırmak veya yeni talep yaratmak isteyen markalar için uygundur.",
    actions: ["Kreatif açı üretimi", "Video reklam senaryosu", "Kampanya testi", "Performans optimizasyonu"],
    impact: "Marka keşfini hızlandırır, kreatif öğrenme sağlar ve yeni müşteri kazanım kanalı açar."
  },
  {
    icon: "LineChart",
    title: "SEO Hizmeti",
    short: "Teknik SEO, içerik planı ve otorite çalışmalarıyla organik görünürlüğünüzü büyütürüz.",
    fit: "Reklama bağımlılığı azaltmak ve uzun vadeli talep yaratmak isteyen işletmeler için uygundur.",
    actions: ["Teknik analiz", "Kelime haritası", "İçerik briefleri", "Performans takibi"],
    impact: "Sürdürülebilir trafik, daha düşük edinim maliyeti ve güçlü marka otoritesi sağlar."
  },
  {
    icon: "MessagesSquare",
    title: "Sosyal Medya Yönetimi",
    short: "Marka dilinize uygun içerik planı, paylaşım akışı ve topluluk yönetimi oluştururuz.",
    fit: "Dijitalde düzenli, profesyonel ve güven veren görünmek isteyen markalar için uygundur.",
    actions: ["Aylık içerik takvimi", "Görsel yönlendirme", "Metin yazımı", "Topluluk takibi"],
    impact: "Marka algısını güçlendirir, güven inşa eder ve reklam performansını destekler."
  },
  {
    icon: "Gauge",
    title: "Performans Pazarlaması",
    short: "Bütün kanalları tek büyüme planında birleştirip veriye göre yönetiriz.",
    fit: "Bütçesini ölçeklemek, edinim maliyetini kontrol etmek ve satış hacmini artırmak isteyen markalar için uygundur.",
    actions: ["Kanal karması", "Funnel tasarımı", "A/B testleri", "KPI takibi"],
    impact: "Pazarlama kararlarını tahminden çıkarır, hedef ve sonuç arasındaki mesafeyi kısaltır."
  },
  {
    icon: "LayoutTemplate",
    title: "Web Tasarım & Landing Page",
    short: "Hızlı, mobil uyumlu ve dönüşüm odaklı web sayfaları tasarlar ve yayına hazırlarız.",
    fit: "Reklam trafiğini daha iyi karşılamak, form ve satış dönüşümünü artırmak isteyen işletmeler için uygundur.",
    actions: ["UX akışı", "Landing page metni", "Responsive tasarım", "Teknik yayın hazırlığı"],
    impact: "Ziyaretçiyi daha hızlı ikna eder, reklam yatırımının geri dönüşünü güçlendirir."
  },
  {
    icon: "Sparkles",
    title: "İçerik ve Kreatif Üretimi",
    short: "Reklam, sosyal medya ve web için satış odaklı metin ve kreatif fikirler üretiriz.",
    fit: "Kreatif yorgunluğu yaşayan veya marka mesajını netleştirmek isteyen ekipler için uygundur.",
    actions: ["Kreatif strateji", "Reklam metinleri", "Video fikirleri", "Görsel briefleri"],
    impact: "Daha güçlü mesaj, daha iyi tıklanma oranı ve daha yüksek dönüşüm potansiyeli oluşturur."
  },
  {
    icon: "BarChart3",
    title: "Raporlama & Analiz",
    short: "Veriyi anlaşılır hale getirir, neyin çalıştığını ve sonraki aksiyonu netleştiririz.",
    fit: "Harcamalarını, sonuçlarını ve büyüme fırsatlarını şeffaf görmek isteyen tüm işletmeler için uygundur.",
    actions: ["KPI panosu", "Haftalık yorum", "Aylık rapor", "Aksiyon önerileri"],
    impact: "Karar alma hızını artırır, bütçe yönetimini güçlendirir ve ekipleri aynı hedefte toplar."
  }
];

export const whyItems = [
  {
    title: "Veriyle düşünen strateji",
    text: "Her kampanyaya hedef, ölçüm planı ve net başarı metriğiyle başlarız. His yerine veriyle ilerleriz."
  },
  {
    title: "Kreatif ve performans birlikte",
    text: "Sadece reklam kurmayız; mesaj, teklif, sayfa ve kreatif uyumunu büyüme sisteminin parçası olarak ele alırız."
  },
  {
    title: "Şeffaf raporlama",
    text: "Bütçenin nereye gittiğini, hangi kanalın ne ürettiğini ve bir sonraki adımın neden gerekli olduğunu açıkça gösteririz."
  },
  {
    title: "KOBİ’den kurumsala esnek yapı",
    text: "Yerel işletmeler için çevik, büyüyen markalar için ölçeklenebilir, kurumsal ekipler için düzenli çalışırız."
  }
];

export const processSteps = [
  {
    title: "Analiz",
    text: "Marka, hedef kitle, rakipler, mevcut kanallar ve dönüşüm altyapısı incelenir."
  },
  {
    title: "Strateji",
    text: "Hedef, kanal karması, teklif, kreatif yön ve bütçe dağılımı netleştirilir."
  },
  {
    title: "Kurulum",
    text: "Hesaplar, takip kodları, kampanya yapıları ve raporlama panosu hazırlanır."
  },
  {
    title: "Yayına Alma",
    text: "Kampanyalar kontrollü şekilde yayına alınır ve ilk veri öğrenmeleri toplanır."
  },
  {
    title: "Optimizasyon",
    text: "Hedef kitle, kreatif, teklif, bütçe ve landing page performansı düzenli iyileştirilir."
  },
  {
    title: "Raporlama",
    text: "Sonuçlar sade bir dille yorumlanır; öğrenimler ve aksiyonlar paylaşılır."
  },
  {
    title: "Büyüme",
    text: "Çalışan kanallar ölçeklenir, yeni fırsatlar test edilir ve sistem genişletilir."
  }
];

export const sectors = [
  {
    icon: "ShoppingBag",
    title: "E-ticaret",
    text: "Ürün, sepet ve yeniden pazarlama akışlarını satış hacmini artıracak şekilde kurgularız."
  },
  {
    icon: "HeartPulse",
    title: "Sağlık ve klinikler",
    text: "Güven, uzmanlık ve randevu dönüşümünü önceleyen etik dijital kampanyalar hazırlarız."
  },
  {
    icon: "Building2",
    title: "Gayrimenkul",
    text: "Proje, portföy ve lead toplama kampanyalarını nitelikli başvuru odağıyla yönetiriz."
  },
  {
    icon: "GraduationCap",
    title: "Eğitim",
    text: "Kurs, okul ve eğitim programları için başvuru ve bilgilendirme akışları oluştururuz."
  },
  {
    icon: "Utensils",
    title: "Restoran ve kafe",
    text: "Yerel görünürlük, rezervasyon, paket servis ve kampanya duyurularını güçlendiririz."
  },
  {
    icon: "Gem",
    title: "Güzellik ve estetik",
    text: "Hizmet değerini doğru anlatan, güven veren ve randevuya yönlendiren içerikler üretiriz."
  },
  {
    icon: "MapPin",
    title: "Yerel işletmeler",
    text: "Yakın çevrede talep yaratmak için Google, sosyal medya ve WhatsApp akışlarını birleştiririz."
  },
  {
    icon: "BriefcaseBusiness",
    title: "Kurumsal firmalar",
    text: "Marka itibarı, talep yaratma ve ölçülebilir kampanya yönetimini kurumsal standartta yürütürüz."
  }
];

export const blogPosts = [
  {
    category: "Meta Ads",
    title: "Meta reklamları nasıl daha verimli kullanılır?",
    excerpt: "Hedef kitle, kreatif test ve dönüşüm takibiyle Meta reklamlarından daha net sonuç almanın yolları.",
    readTime: "5 dk"
  },
  {
    category: "Google Ads",
    title: "Google Ads bütçesi nasıl belirlenir?",
    excerpt: "Arama hacmi, hedef edinim maliyeti ve satış değerine göre gerçekçi reklam bütçesi planlama rehberi.",
    readTime: "6 dk"
  },
  {
    category: "SEO",
    title: "SEO neden uzun vadeli yatırım olarak görülmelidir?",
    excerpt: "Organik görünürlüğün marka güveni, trafik kalitesi ve reklam bağımlılığı üzerindeki etkisi.",
    readTime: "4 dk"
  },
  {
    category: "TikTok Ads",
    title: "TikTok reklamları hangi işletmeler için uygundur?",
    excerpt: "Keşif odaklı video reklamların hangi sektörlerde daha hızlı öğrenme ve talep yarattığını inceliyoruz.",
    readTime: "5 dk"
  },
  {
    category: "E-ticaret",
    title: "E-ticaret markaları için performans pazarlaması rehberi",
    excerpt: "Sepet, ürün sayfası, reklam kanalı ve raporlama sistemini birlikte büyütmek için temel çerçeve.",
    readTime: "8 dk"
  }
];

export const faqItems = [
  {
    question: "Aky Dijital hangi işletmelerle çalışır?",
    answer:
      "KOBİ’ler, e-ticaret markaları, yerel işletmeler, girişimler ve kurumsal firmalarla çalışırız. Önceliğimiz, ölçülebilir büyüme hedefi olan işletmeler için doğru kanal ve aksiyon planını kurmaktır."
  },
  {
    question: "Reklam bütçem düşükse çalışmaya başlayabilir miyiz?",
    answer:
      "Evet. Bütçeyi gerçekçi hedeflerle eşleştiririz. İlk amaç çoğu zaman sistemi doğru kurmak, veriyi temiz toplamak ve bütçe büyümeden önce çalışan mesajı bulmaktır."
  },
  {
    question: "Sonuçları nasıl raporluyorsunuz?",
    answer:
      "Kanal bazlı performans, harcama, dönüşüm, edinim maliyeti ve sonraki aksiyonları sade bir raporla paylaşırız. Rapor, sadece sayı değil; karar almaya yarayan yorum içerir."
  },
  {
    question: "Web sitem yoksa reklam çalışması yapılabilir mi?",
    answer:
      "Yapılabilir. İhtiyaca göre landing page, WhatsApp yönlendirmesi, form altyapısı veya hızlı açılan kampanya sayfası hazırlayabiliriz."
  },
  {
    question: "Ücretsiz strateji görüşmesinde ne konuşulur?",
    answer:
      "Mevcut durumunuzu, hedeflerinizi, reklam bütçenizi ve büyüme fırsatlarınızı değerlendiririz. Görüşme sonunda size ilk kanal ve aksiyon önerilerini net şekilde iletiriz."
  }
];

export const sloganIdeas = [
  "Dijitalde net strateji, ölçülebilir büyüme.",
  "Bütçeyi veriye, veriyi büyümeye dönüştürür.",
  "Markanız için 360° dijital büyüme sistemi.",
  "Performans, kreatif ve strateji aynı masada.",
  "Daha net hedef, daha güçlü dönüşüm."
];

export const seoPages = [
  {
    page: "Ana Sayfa",
    title: "Aky Dijital | 360° Dijital Pazarlama Ajansı",
    description:
      "Aky Dijital; Meta Ads, Google Ads, TikTok Ads, SEO, sosyal medya ve web tasarım hizmetleriyle markanızı dijitalde büyüten yeni nesil ajanstır."
  },
  {
    page: "Hizmetler",
    title: "Dijital Pazarlama Hizmetleri | Aky Dijital",
    description:
      "Meta Ads, Google Ads, TikTok Ads, SEO, performans pazarlaması, içerik üretimi, raporlama ve landing page hizmetlerini keşfedin."
  },
  {
    page: "Hakkımızda",
    title: "Hakkımızda | Aky Dijital",
    description:
      "Aky Dijital’in veri odaklı, sonuç odaklı ve şeffaf çalışma anlayışını tanıyın. Markalar için yeni nesil dijital büyüme yaklaşımı."
  },
  {
    page: "Sektörler",
    title: "Sektörlere Özel Dijital Pazarlama | Aky Dijital",
    description:
      "E-ticaret, sağlık, gayrimenkul, eğitim, restoran, güzellik, yerel işletme ve kurumsal firmalar için dijital pazarlama çözümleri."
  },
  {
    page: "Blog",
    title: "Dijital Pazarlama Blogu | Aky Dijital",
    description:
      "Meta reklamları, Google Ads bütçesi, SEO, TikTok Ads ve e-ticaret performans pazarlaması hakkında pratik blog içerikleri."
  },
  {
    page: "İletişim",
    title: "Ücretsiz Strateji Görüşmesi Al | Aky Dijital",
    description:
      "Aky Dijital ile ücretsiz strateji görüşmesi planlayın. Reklam, SEO, sosyal medya ve web tasarım ihtiyaçlarınızı birlikte değerlendirelim."
  }
];
