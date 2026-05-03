import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/Motion";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Ücretsiz Strateji Görüşmesi Al",
  description:
    "Aky Dijital ile ücretsiz strateji görüşmesi planlayın. Reklam, SEO, sosyal medya ve web tasarım ihtiyaçlarınızı birlikte değerlendirelim."
};

export default function ContactPage() {
  return (
    <main>
      <section className="border-b border-white/10 bg-carbon-900/60">
        <div className="section-shell section-y grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <Reveal>
            <p className="eyebrow">İletişim</p>
            <h1 className="mt-5 text-balance text-[clamp(2.15rem,7vw,3.5rem)] font-black leading-[1.05] tracking-normal text-white">
              Ücretsiz strateji görüşmesiyle büyüme fırsatlarınızı netleştirelim.
            </h1>
            <p className="mt-6 text-base leading-8 text-fog-300 sm:text-lg">
              Formu doldurun veya WhatsApp’tan yazın. Mevcut durumunuzu, hedeflerinizi
              ve reklam bütçenizi değerlendirip size ilk aksiyon önerilerini iletelim.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-fog-300">
              <a href="tel:+905451781534" className="flex items-center gap-3 transition hover:text-acid">
                <Phone className="size-5 text-electric" />
                +90 545 178 15 34
              </a>
              <a href="mailto:merhaba@akydijital.com" className="flex items-center gap-3 transition hover:text-acid">
                <Mail className="size-5 text-electric" />
                merhaba@akydijital.com
              </a>
              <a
                href="https://wa.me/905451781534"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 transition hover:text-acid"
              >
                <MessageCircle className="size-5 text-electric" />
                WhatsApp üzerinden hızlı iletişim
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <section className="section-shell section-y">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <SectionHeader
            eyebrow="Konum"
            title="Ofis konumları"
            description="Aky Dijital ile Türkiye ve İngiltere ofis adresleri üzerinden iletişime geçebilirsiniz. Yayın öncesinde bu alana Google Maps embed bağlantıları eklenebilir."
          />
          <div className="grid gap-4">
            {[
              {
                title: "Türkiye Ofisi",
                address: "50. Yıl Mh. B Cad. No: 56/1 Sultangazi / İstanbul"
              },
              {
                title: "İngiltere Ofisi",
                address: "Suite 10586, 5 Brayford Square, London, United Kingdom, E1 0SG"
              }
            ].map((office) => (
              <div key={office.title} className="surface rounded-lg p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-acid/12 text-acid">
                    <MapPin className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-black text-white">{office.title}</h2>
                    <p className="mt-3 break-words text-sm leading-7 text-fog-400">{office.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
