import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  Zap
} from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { FAQ } from "@/components/FAQ";
import { HeroVisual } from "@/components/HeroVisual";
import { Reveal } from "@/components/Motion";
import { SectionHeader } from "@/components/SectionHeader";
import { ServiceGrid } from "@/components/ServiceGrid";
import { blogPosts, processSteps, sectors, services, trustStats, whyItems } from "@/lib/content";
import { iconMap } from "@/components/IconMap";

export default function HomePage() {
  return (
    <main>
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <HeroVisual />
        <div className="section-shell grid min-h-[calc(88svh-4.5rem)] items-center gap-10 py-14 sm:min-h-[calc(100svh-5rem)] sm:py-20 lg:gap-12 lg:py-24">
          <div className="relative z-10 max-w-[40rem] xl:max-w-[42rem]">
            <Reveal>
              <p className="eyebrow">Aky Dijital • 360° dijital pazarlama ajansı</p>
              <h1 className="mt-5 text-balance text-[clamp(2.25rem,6.6vw,4.15rem)] font-black leading-[1.04] tracking-normal text-white">
                Aky Dijital ile reklam bütçenizi{" "}
                <span className="gradient-text">ölçülebilir büyümeye</span> dönüştürün.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-fog-300 sm:text-xl">
                Meta, Google, TikTok, SEO, sosyal medya, içerik ve landing page
                çalışmalarını tek strateji altında birleştirir; ziyaretçiyi forma,
                WhatsApp’a ve satışa yönlendiren dijital büyüme sistemi kurarız.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/iletisim" className="button-primary">
                  Ücretsiz Strateji Görüşmesi Al
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/hizmetler" className="button-secondary">
                  Hizmetleri İncele
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-fog-400">
                {["Şeffaf raporlama", "Haftalık optimizasyon", "Dönüşüm odaklı landing page"].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-acid" />
                      {item}
                    </span>
                  )
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-carbon-900/60">
        <div className="section-shell grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {trustStats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.05} className="surface rounded-lg p-4 sm:p-5">
              <p className="text-2xl font-black text-white sm:text-3xl">{stat.value}</p>
              <p className="mt-2 text-sm leading-6 text-fog-400">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-shell section-y" id="hizmetler">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <SectionHeader
            eyebrow="Hizmetler"
            title="Kanal kanal değil, büyüme sistemi olarak çalışırız."
            description="Reklam yönetimi, SEO, içerik, sosyal medya, web tasarım ve raporlama disiplinlerini aynı hedefe bağlarız: daha nitelikli trafik, daha güçlü dönüşüm, daha net karar."
          />
          <div className="surface rounded-lg p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Target, title: "Doğru hedef", text: "Kitle, teklif ve kanal uyumu" },
                { icon: Zap, title: "Hızlı test", text: "Kreatif ve mesaj öğrenmesi" },
                { icon: LineChart, title: "Net ölçüm", text: "KPI, rapor ve aksiyon planı" }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="border-l border-white/10 pl-4">
                    <Icon className="size-5 text-acid" />
                    <p className="mt-3 font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-fog-400">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-10">
          <ServiceGrid services={services.slice(0, 6)} />
        </div>
      </section>

      <section className="border-y border-white/10 bg-fog-50 text-carbon-950">
        <div className="section-shell section-y">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-carbon-800">Neden Aky Dijital?</p>
              <h2 className="mt-4 text-balance text-3xl font-black tracking-normal sm:text-4xl lg:text-5xl">
                Güzel görünen kampanyalar değil, büyümeye bağlanan sistemler kurarız.
              </h2>
              <p className="mt-5 text-base leading-8 text-carbon-800">
                Aky Dijital, strateji, kreatif ve performans ekiplerini ayrı silolar
                gibi değil, aynı büyüme masasında çalışan bir sistem olarak konumlandırır.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {whyItems.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.05} className="rounded-lg border border-carbon-950/10 bg-carbon-950/[0.035] p-5">
                  <ShieldCheck className="size-5 text-carbon-950" />
                  <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-carbon-800">{item.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell section-y">
        <SectionHeader
          eyebrow="Süreç"
          title="İlk analizden ölçeklemeye kadar sade ve ölçülebilir akış."
          description="Her aşamada ne yaptığımız, neyi ölçtüğümüz ve bir sonraki hamlenin neden gerekli olduğu nettir."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          {processSteps.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.04} className="surface rounded-lg p-4 sm:p-5">
              <span className="text-sm font-black text-acid">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-lg font-black text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-fog-400">{step.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-carbon-900/70">
        <div className="section-shell section-y">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              eyebrow="Sektörler"
              title="Farklı sektörler için farklı büyüme kaldıraçları."
              description="Aynı reklam şablonunu herkese uygulamayız. Sektörünüzün karar sürecini, güven bariyerlerini ve dönüşüm yolunu merkeze alırız."
            />
            <Link href="/sektorler" className="button-secondary w-fit">
              Tüm sektörler
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sectors.map((sector, index) => {
              const Icon = iconMap[sector.icon];
              return (
                <Reveal key={sector.title} delay={index * 0.04} className="surface rounded-lg p-4 sm:p-5">
                  {Icon ? <Icon className="size-5 text-electric" /> : null}
                  <h3 className="mt-4 text-lg font-black text-white">{sector.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-fog-400">{sector.text}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-shell section-y">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="Blog"
            title="Büyüme kararlarını güçlendiren pratik içerikler."
            description="Reklam bütçesi, kanal seçimi, SEO ve performans pazarlaması hakkında sade, uygulanabilir ve işletme odaklı yazılar."
          />
          <Link href="/blog" className="button-secondary w-fit">
            Blogu İncele
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {blogPosts.slice(0, 3).map((post, index) => (
            <Reveal key={post.title} delay={index * 0.05} className="surface rounded-lg p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">{post.category}</p>
              <h3 className="mt-4 text-xl font-black text-white">{post.title}</h3>
              <p className="mt-3 text-sm leading-7 text-fog-400">{post.excerpt}</p>
              <p className="mt-5 text-xs font-semibold text-fog-500">{post.readTime} okuma</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-carbon-900/70">
        <div className="section-shell section-y grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeader
            eyebrow="SSS"
            title="Başlamadan önce en çok sorulanlar."
            description="Doğru ajans ilişkisi net beklentiyle başlar. Görüşme öncesi merak edilen temel noktalar burada."
          />
          <FAQ />
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
