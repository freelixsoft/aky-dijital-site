import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone, Send } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { navItems, services } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-carbon-950">
      <div className="section-shell section-y grid gap-10 lg:grid-cols-[1.05fr_0.65fr_0.75fr_1.25fr]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo tagline="Dijitalde net strateji, ölçülebilir büyüme." />
          </Link>
          <p className="mt-6 max-w-md text-sm leading-7 text-fog-400">
            Meta Ads, Google Ads, TikTok Ads, SEO, sosyal medya, içerik, web tasarım
            ve raporlama hizmetlerini tek büyüme planında birleştiren yeni nesil
            dijital pazarlama ajansı.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Menü</h3>
          <div className="mt-5 grid gap-3">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-fog-400 transition hover:text-acid">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Hizmetler</h3>
          <div className="mt-5 grid gap-3">
            {services.slice(0, 6).map((service) => (
              <Link key={service.title} href="/hizmetler" className="text-sm text-fog-400 transition hover:text-acid">
                {service.title}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">İletişim</h3>
          <div className="mt-5 grid gap-4 text-sm text-fog-400">
            <a className="flex items-center gap-3 transition hover:text-acid" href="tel:+905451781534">
              <Phone className="size-4 text-electric" />
              +90 545 178 15 34
            </a>
            <a className="flex items-center gap-3 transition hover:text-acid" href="mailto:merhaba@akydijital.com">
              <Mail className="size-4 text-electric" />
              merhaba@akydijital.com
            </a>
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 size-4 shrink-0 text-electric" />
              <span className="grid min-w-0 gap-2 leading-6">
                <span>
                  <span className="font-semibold text-fog-200">Türkiye Ofisi:</span>{" "}
                  50. Yıl Mh. B Cad. No: 56/1 Sultangazi / İstanbul
                </span>
                <span>
                  <span className="font-semibold text-fog-200">İngiltere Ofisi:</span>{" "}
                  Suite 10586, 5 Brayford Square, London, United Kingdom, E1 0SG
                </span>
              </span>
            </div>
            <a
              className="button-secondary mt-2 w-fit"
              href="https://wa.me/905451781534"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
              <Send className="size-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="section-shell flex flex-col gap-3 text-xs text-fog-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Aky Dijital. Tüm hakları saklıdır.</p>
          <Link href="/iletisim" className="inline-flex items-center gap-2 transition hover:text-acid">
            Ücretsiz strateji görüşmesi al
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
