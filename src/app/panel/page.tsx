import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MousePointerClick } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Reveal } from "@/components/Motion";
import { panelNavItems } from "@/lib/panel";
import { PanelWorkspace } from "./PanelClient";

export const metadata: Metadata = {
  title: "Meta Ads AI Panel",
  description:
    "Aky Dijital Meta Ads AI Panel. Kampanya metrikleri, AI analiz, optimizasyon önerileri ve kreatif akışları."
};

export default function PanelPage() {
  return (
    <main className="min-h-screen bg-carbon-950">
      <section className="sticky top-0 z-40 border-b border-white/10 bg-carbon-950/88 backdrop-blur-xl">
        <div className="section-shell flex min-h-[4.5rem] items-center justify-between gap-4 py-3">
          <Link href="/" aria-label="Aky Dijital ana sayfa">
            <BrandLogo tagline="Meta Ads AI Panel" />
          </Link>
          <div className="hidden items-center gap-2 lg:flex">
            {panelNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.label} href="#panel-moduller" className="button-ghost text-fog-400">
                  <Icon className="size-4" />
                  {item.label}
                </a>
              );
            })}
          </div>
          <Link href="/" className="button-secondary">
            Siteye Dön
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-grid-lines bg-[length:44px_44px] opacity-[0.1]" />
        <div className="section-shell section-y relative grid gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-end">
          <Reveal>
            <p className="eyebrow">Aky Dijital Panel</p>
            <h1 className="mt-5 max-w-4xl text-balance text-[clamp(2.15rem,7vw,4rem)] font-black leading-[1.04] tracking-normal text-white">
              Meta Ads performansını düzenli, tıklamalı ve AI destekli panelden yönetin.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-fog-300 sm:text-lg">
              Kampanya oluşturma, AI kreatif üretimi, performans analizi, optimizasyon ve reklam
              hesabı bağlantısı tek merkezde toplandı. Detay ekranları yalnızca seçtiğinizde açılır.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#panel-moduller" className="button-primary">
                Panel Modüllerini Aç
                <ArrowRight className="size-4" />
              </a>
              <Link href="/panel/giris" className="button-secondary">
                Giriş Ekranına Dön
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="surface rounded-lg p-5">
            <span className="flex size-12 items-center justify-center rounded-lg border border-acid/25 bg-acid/10 text-acid">
              <MousePointerClick className="size-5" />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-acid">Toparlanmış panel</p>
            <h2 className="mt-3 text-2xl font-black text-white">İlk ekranda sadece seçim var.</h2>
            <p className="mt-3 text-sm leading-7 text-fog-400">
              Önce modülü seçin; Meta bağlantısı, kampanya taslağı, kreatif üretimi, AI analiz,
              tablo veya chat alanı ayrı olarak açılır. Böylece panel dağılmadan yönetilir.
            </p>
            <a href="#panel-moduller" className="button-ghost mt-5 w-full justify-center">
              Modül seçimine git
              <ArrowRight className="size-4" />
            </a>
          </Reveal>
        </div>
      </section>

      <section className="section-shell section-y">
        <PanelWorkspace />
      </section>
    </main>
  );
}
