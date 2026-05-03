import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Motion";
import { SectionHeader } from "@/components/SectionHeader";
import { ServiceGrid } from "@/components/ServiceGrid";
import { services } from "@/lib/content";

export const metadata: Metadata = {
  title: "Dijital Pazarlama Hizmetleri",
  description:
    "Meta Ads, Google Ads, TikTok Ads, SEO, performans pazarlaması, içerik üretimi, raporlama ve landing page hizmetlerini keşfedin."
};

export default function ServicesPage() {
  return (
    <main>
      <section className="border-b border-white/10 bg-carbon-900/60">
        <div className="section-shell section-y">
          <Reveal className="max-w-4xl">
            <p className="eyebrow">Hizmetler</p>
            <h1 className="mt-5 text-balance text-[clamp(2.15rem,7vw,3.5rem)] font-black leading-[1.05] tracking-normal text-white">
              Dijital pazarlama kanallarını tek büyüme planında birleştiriyoruz.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-fog-300 sm:text-lg">
              Aky Dijital; reklam yönetimi, SEO, sosyal medya, kreatif üretim,
              landing page ve raporlama süreçlerini işletmenizin hedeflerine göre
              tasarlar. Amaç sadece trafik değil, ölçülebilir dönüşümdür.
            </p>
            <Link href="/iletisim" className="button-primary mt-8">
              Hizmetler İçin Teklif Al
              <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="section-shell section-y">
        <SectionHeader
          eyebrow="Detaylı hizmet kapsamı"
          title="Her hizmette hedef, uygulama ve işletmeye katkı net."
          description="Aşağıdaki kapsamlar başlangıç stratejisiyle özelleştirilir. Büyüme hedefiniz, bütçeniz ve mevcut altyapınız hizmet planını belirler."
        />
        <div className="mt-10">
          <ServiceGrid services={services} detailed />
        </div>
      </section>

      <CtaBand title="Hangi hizmete ihtiyacınız olduğundan emin değil misiniz?" text="Kısa bir analiz görüşmesiyle mevcut durumunuzu değerlendirip markanız için en doğru kanal sıralamasını birlikte çıkaralım." />
    </main>
  );
}
