import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Tags } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Motion";
import { SectionHeader } from "@/components/SectionHeader";
import { blogPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Dijital Pazarlama Blogu",
  description:
    "Meta reklamları, Google Ads bütçesi, SEO, TikTok Ads ve e-ticaret performans pazarlaması hakkında pratik blog içerikleri."
};

const categories = [
  "Meta Ads",
  "Google Ads",
  "SEO",
  "TikTok Ads",
  "E-ticaret",
  "Sosyal Medya",
  "Landing Page",
  "Raporlama"
];

export default function BlogPage() {
  return (
    <main>
      <section className="border-b border-white/10 bg-carbon-900/60">
        <div className="section-shell section-y">
          <Reveal className="max-w-4xl">
            <p className="eyebrow">Blog</p>
            <h1 className="mt-5 text-balance text-[clamp(2.15rem,7vw,3.5rem)] font-black leading-[1.05] tracking-normal text-white">
              Dijital pazarlama kararlarını daha net almanız için pratik rehberler.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-fog-300 sm:text-lg">
              Reklam bütçesi, kanal seçimi, SEO, kreatif üretim ve performans raporlama
              konularında sade, işletme odaklı ve uygulanabilir içerikler.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-shell section-y">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="surface h-fit rounded-lg p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Tags className="size-5 text-acid" />
              <h2 className="text-lg font-black text-white">Blog kategorileri</h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category} className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-fog-300">
                  {category}
                </span>
              ))}
            </div>
          </aside>

          <div>
            <SectionHeader
              eyebrow="Yazı önerileri"
              title="SEO uyumlu içerik başlangıç planı."
              description="Bu başlıklar, Aky Dijital’in hedef kitlesinin aradığı sorulara cevap verirken hizmet sayfalarına nitelikli trafik taşımak için tasarlandı."
            />
            <div className="mt-8 grid gap-4">
              {blogPosts.map((post, index) => (
                <Reveal key={post.title} delay={index * 0.04} className="surface rounded-lg p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">{post.category}</p>
                      <h2 className="mt-3 break-words text-xl font-black text-white sm:text-2xl">{post.title}</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-fog-400">{post.excerpt}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-fog-500">
                      <BookOpen className="size-4" />
                      {post.readTime}
                    </div>
                  </div>
                  <Link href="/iletisim" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-acid">
                    Bu konuda destek al
                    <ArrowRight className="size-4" />
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Blogdan öğrendiklerinizi markanız için aksiyona çevirelim." />
    </main>
  );
}
