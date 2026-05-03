import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { iconMap } from "@/components/IconMap";
import { Reveal } from "@/components/Motion";
import { SectionHeader } from "@/components/SectionHeader";
import { sectors } from "@/lib/content";

export const metadata: Metadata = {
  title: "Sektörlere Özel Dijital Pazarlama",
  description:
    "E-ticaret, sağlık, gayrimenkul, eğitim, restoran, güzellik, yerel işletme ve kurumsal firmalar için dijital pazarlama çözümleri."
};

export default function SectorsPage() {
  return (
    <main>
      <section className="border-b border-white/10 bg-carbon-900/60">
        <div className="section-shell section-y">
          <Reveal className="max-w-4xl">
            <p className="eyebrow">Sektörler</p>
            <h1 className="mt-5 text-balance text-[clamp(2.15rem,7vw,3.5rem)] font-black leading-[1.05] tracking-normal text-white">
              Her sektörün satın alma yolculuğu farklıdır. Strateji de farklı olmalıdır.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-fog-300 sm:text-lg">
              Aky Dijital, sektörünüzün karar sürecini, güven ihtiyacını, arama niyetini
              ve dönüşüm kanalını analiz ederek uygulanabilir büyüme planı oluşturur.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-shell section-y">
        <SectionHeader
          eyebrow="Çözümler"
          title="Sektöre göre mesaj, kanal ve dönüşüm akışı."
          description="E-ticarette sepet değeri, kliniklerde güven, gayrimenkulde nitelikli lead, restoranlarda yerel talep önceliklidir. Bu farkları stratejinin merkezine alırız."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sectors.map((sector, index) => {
            const Icon = iconMap[sector.icon];
            return (
              <Reveal key={sector.title} delay={index * 0.04} className="surface rounded-lg p-4 sm:p-5">
                {Icon ? <Icon className="size-6 text-acid" /> : null}
                <h2 className="mt-5 text-xl font-black text-white">{sector.title}</h2>
                <p className="mt-3 text-sm leading-7 text-fog-400">{sector.text}</p>
                <Link href="/iletisim" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-acid">
                  Sektörünüz için görüşelim
                  <ArrowRight className="size-4" />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <CtaBand title="Sektörünüz için en doğru büyüme kanalını birlikte belirleyelim." />
    </main>
  );
}
