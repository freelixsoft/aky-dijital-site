import { ArrowRight, MessageCircle } from "lucide-react";

const serviceOptions = [
  "Meta Ads Yönetimi",
  "Google Ads Yönetimi",
  "TikTok Ads Yönetimi",
  "SEO Hizmeti",
  "Sosyal Medya Yönetimi",
  "Performans Pazarlaması",
  "Web Tasarım & Landing Page",
  "Raporlama & Analiz",
  "360° Danışmanlık"
];

const budgetOptions = [
  "Henüz net değil",
  "10.000 TL altı",
  "10.000 - 30.000 TL",
  "30.000 - 75.000 TL",
  "75.000 TL üzeri"
];

export function ContactForm() {
  return (
    <form className="surface grid gap-4 rounded-lg p-4 sm:p-6" action="#" method="post">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Ad Soyad
          <input className="min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500" name="name" placeholder="Adınız ve soyadınız" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Firma Adı
          <input className="min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500" name="company" placeholder="Firma adınız" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Telefon
          <input className="min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500" name="phone" placeholder="+90 5xx xxx xx xx" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          E-posta
          <input className="min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500" name="email" placeholder="ornek@firma.com" type="email" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Hizmet Seçimi
          <select className="min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" name="service" defaultValue="">
            <option value="" disabled>Hizmet seçin</option>
            {serviceOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-fog-100">
          Aylık Reklam Bütçesi
          <select className="min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" name="budget" defaultValue="">
            <option value="" disabled>Bütçe aralığı seçin</option>
            {budgetOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-fog-100">
        Mesaj
        <textarea
          className="min-h-32 min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
          name="message"
          placeholder="Hedefinizi, mevcut kanallarınızı ve ihtiyaçlarınızı kısaca paylaşın."
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="button-primary flex-1" type="submit">
          Formu Gönder
          <ArrowRight className="size-4" />
        </button>
        <a
          className="button-secondary flex-1"
          href="https://wa.me/905451781534"
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp’tan Yaz
          <MessageCircle className="size-4" />
        </a>
      </div>
      <p className="text-xs leading-6 text-fog-500">
        Formu gönderdikten sonra ekibimiz hedeflerinize uygun ilk değerlendirme için sizinle iletişime geçer.
      </p>
    </form>
  );
}
