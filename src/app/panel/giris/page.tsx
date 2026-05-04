import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Reveal } from "@/components/Motion";
import { panelFeatures } from "@/lib/panel";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Meta Ads AI Panel Girişi",
  description:
    "Aky Dijital Meta Ads AI Panel girişi. Kampanya performansı, AI analiz, optimizasyon ve kreatif üretim akışlarına erişin."
};

export default function PanelLoginPage() {
  return (
    <main className="min-h-screen bg-carbon-950">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-grid-lines bg-[length:44px_44px] opacity-[0.12]" />
        <div className="section-shell relative grid min-h-screen gap-8 py-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-10">
          <div className="min-w-0">
            <Link href="/" className="inline-flex">
              <BrandLogo tagline="Meta Ads AI Panel" />
            </Link>
            <Reveal className="mt-16 max-w-3xl lg:mt-20">
              <p className="eyebrow">AI destekli reklam yönetimi</p>
              <h1 className="mt-5 text-balance text-[clamp(2.3rem,8vw,4.5rem)] font-black leading-[1.03] tracking-normal text-white">
                Meta reklamlarını tek panelden analiz edin, yorumlayın ve optimize edin.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-fog-300 sm:text-lg">
                Mevcut Meta Ads panelindeki AI analiz, kampanya içgörüleri, kreatif üretim
                ve optimizasyon akışlarını Aky Dijital’in premium web deneyimiyle uyumlu hale getirdik.
              </p>
              <div className="mt-8 grid gap-3 text-sm text-fog-300 sm:grid-cols-3">
                {["Meta Ads verisi", "OpenAI analizleri", "Aksiyon odaklı rapor"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-acid" />
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="surface rounded-lg p-4 sm:p-6 lg:p-8">
            <div className="mb-7 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Panel erişimi</p>
                <h2 className="mt-2 text-3xl font-black text-white">Giriş Yap</h2>
              </div>
              <span className="flex size-11 items-center justify-center rounded-lg bg-electric/12 text-electric">
                <ShieldCheck className="size-5" />
              </span>
            </div>
            <LoginForm />
            <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-fog-400 transition hover:text-acid">
              <ArrowLeft className="size-4" />
              Siteye geri dön
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="section-shell section-y">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {panelFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 0.05} className="surface rounded-lg p-5">
                <Icon className="size-6 text-acid" />
                <h2 className="mt-5 text-lg font-black text-white">{feature.title}</h2>
                <p className="mt-2 text-sm leading-7 text-fog-400">{feature.text}</p>
              </Reveal>
            );
          })}
        </div>
      </section>
    </main>
  );
}
