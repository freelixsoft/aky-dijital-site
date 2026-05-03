import type { Metadata } from "next";
import { BarChart3, BrainCircuit, Handshake, Target } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Motion";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Aky Dijital’in veri odaklı, sonuç odaklı ve şeffaf çalışma anlayışını tanıyın. Markalar için yeni nesil dijital büyüme yaklaşımı."
};

const principles = [
  {
    icon: BrainCircuit,
    title: "Strateji önce gelir",
    text: "Kampanya kurmadan önce hedef, teklif, kitle, kanal ve ölçüm altyapısını netleştiririz."
  },
  {
    icon: BarChart3,
    title: "Veri sadeleşmelidir",
    text: "Raporlarımız karmaşık tablo yığını değil; karar aldıran net içgörüler ve aksiyonlardan oluşur."
  },
  {
    icon: Target,
    title: "Dönüşüm ortak hedeftir",
    text: "Reklam, içerik ve web deneyimini aynı hedefe bağlarız: daha nitelikli talep ve satış fırsatı."
  },
  {
    icon: Handshake,
    title: "İlişki şeffaftır",
    text: "Neyi neden yaptığımızı açıklarız; markanın pazarlama kasını da süreç boyunca güçlendiririz."
  }
];

export default function AboutPage() {
  return (
    <main>
      <section className="border-b border-white/10 bg-carbon-900/60">
        <div className="section-shell section-y grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] lg:items-end">
          <Reveal className="min-w-0">
            <p className="eyebrow">Hakkımızda</p>
            <h1 className="mt-5 max-w-4xl text-balance text-[clamp(2.15rem,7vw,3.5rem)] font-black leading-[1.05] tracking-normal text-white">
              Aky Dijital, markalar için veri odaklı büyüme sistemi kuran yeni nesil ajanstır.
            </h1>
          </Reveal>
          <Reveal delay={0.1} className="surface min-w-0 rounded-lg p-5 sm:p-6">
            <p className="text-base leading-8 text-fog-300">
              Dijital pazarlamada başarının yalnızca reklam hesabı yönetmekten
              ibaret olmadığına inanıyoruz. Doğru strateji, güçlü mesaj, hızlı
              sayfa deneyimi, temiz ölçüm ve düzenli optimizasyon bir araya geldiğinde
              pazarlama gerçek bir büyüme motoruna dönüşür.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-shell section-y">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Misyon",
              text: "İşletmelerin dijital pazarlama yatırımlarını daha anlaşılır, ölçülebilir ve karlı hale getirmek."
            },
            {
              title: "Vizyon",
              text: "Türkiye’de KOBİ’lerden kurumsal markalara kadar her ölçekte işletmenin güvenle çalıştığı büyüme partneri olmak."
            },
            {
              title: "Çalışma anlayışı",
              text: "Net hedef, sade iletişim, şeffaf raporlama ve sürekli iyileştirme kültürüyle hareket etmek."
            }
          ].map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05} className="surface min-w-0 rounded-lg p-5 sm:p-6">
              <h2 className="break-words text-xl font-black text-white sm:text-2xl">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-fog-400">{item.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-fog-50 text-carbon-950">
        <div className="section-shell section-y">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-carbon-800">Yaklaşım</p>
            <h2 className="mt-4 text-balance text-3xl font-black tracking-normal sm:text-4xl lg:text-5xl">
              Kurumsal disiplin, samimi iletişim, sonuç odaklı aksiyon.
            </h2>
            <p className="mt-5 text-base leading-8 text-carbon-800 sm:text-lg">
              Aky Dijital’in temel farkı, pazarlama sürecini hem stratejik hem uygulanabilir tutmasıdır.
              Karmaşık dili sadeleştirir, her adımı işletme hedefiyle ilişkilendiririz.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {principles.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal
                  key={item.title}
                  delay={index * 0.05}
                  className="min-w-0 rounded-lg border border-carbon-950/10 bg-carbon-950/[0.035] p-5"
                >
                  <Icon className="size-6 text-carbon-950" />
                  <h3 className="mt-5 break-words text-lg font-black text-carbon-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-carbon-800">{item.text}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand title="Aky Dijital’in markanıza nasıl katkı sağlayacağını konuşalım." />
    </main>
  );
}
