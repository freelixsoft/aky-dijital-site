import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, LockKeyhole, RefreshCw } from "lucide-react";
import { Reveal } from "@/components/Motion";
import { SubscriptionClient } from "./SubscriptionClient";

export const metadata: Metadata = {
  title: "Meta Reklam AI Panel Abonelikleri",
  description: "Aky Dijital Meta reklam AI paneli için 30 günlük abonelik paketleri."
};

export default function SubscriptionPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-grid-lines bg-[length:44px_44px] opacity-[0.1]" />
        <div className="section-shell section-y relative grid gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-end">
          <Reveal>
            <p className="eyebrow">Meta Reklam AI Panel</p>
            <h1 className="mt-5 max-w-4xl text-balance text-[clamp(2.15rem,7vw,4rem)] font-black leading-[1.04] tracking-normal text-white">
              Reklam hesabınızı AI destekli panelle 30 günlük abonelikle yönetin.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-fog-300 sm:text-lg">
              Meta bağlantısı, kampanya tablosu, AI analiz, kreatif üretimi, optimizasyon raporları ve müşteri
              anlaşılır performans özetleri tek ekranda çalışır. Plan aktif değilse panel kilitlenir.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#paketler" className="button-primary">
                Paketleri İncele
                <ArrowRight className="size-4" />
              </a>
              <Link href="/panel" className="button-secondary">
                Paneli Gör
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="surface rounded-lg p-5">
            <div className="grid gap-4">
              {[
                { icon: BarChart3, title: "Canlı reklam verisi", text: "Satış, trafik, mesaj ve lead kampanyalarını ayrı okur." },
                { icon: RefreshCw, title: "30 günde yenileme", text: "Sayaç biterse panel erişimi durur." },
                { icon: LockKeyhole, title: "Plan bazlı sınırlar", text: "Paket büyüdükçe bağlanabilir reklam hesabı artar." }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <Icon className="size-5 text-acid" />
                    <h2 className="mt-3 text-lg font-black text-white">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-fog-400">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="paketler" className="section-shell section-y">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Abonelik paketleri</p>
          <h2 className="mt-4 text-balance text-3xl font-black text-white sm:text-4xl">
            İhtiyacınız kadar reklam hesabı, aynı net panel deneyimi.
          </h2>
          <p className="mt-4 text-sm leading-7 text-fog-400 sm:text-base">
            Planlar 30 günlük çalışır. Süre bittiğinde panel kullanımı durur; yenileme yapıldığında sayaç yeniden başlar.
          </p>
        </div>
        <div className="mt-10">
          <SubscriptionClient />
        </div>
      </section>
    </main>
  );
}
