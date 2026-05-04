"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, MousePointerClick, Target, TrendingUp } from "lucide-react";

const bars = [68, 44, 76, 58, 86, 72, 94];

export function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 -z-10 mx-auto h-[560px] max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-grid-lines bg-[length:44px_44px] opacity-[0.18]" />
      <motion.div
        className="absolute -right-44 top-8 hidden w-[46rem] rounded-lg border border-white/10 bg-carbon-900/80 p-5 shadow-glow backdrop-blur xl:block 2xl:w-[48rem]"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-acid">Growth Command</p>
            <h2 className="mt-1 text-xl font-black text-white">Kanal performansı</h2>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-acid/12 px-3 py-2 text-xs font-bold text-acid">
            <TrendingUp className="size-4" />
            +38% dönüşüm
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Meta ROAS", value: "4.7x", icon: Target, color: "text-electric" },
            { label: "Google CVR", value: "%8.9", icon: MousePointerClick, color: "text-acid" },
            { label: "SEO Trafik", value: "+64%", icon: ArrowUpRight, color: "text-ember" }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="border border-white/10 bg-white/[0.045] p-4">
                <Icon className={`size-5 ${item.color}`} />
                <p className="mt-5 text-2xl font-black text-white">{item.value}</p>
                <p className="mt-1 text-xs font-medium text-fog-500">{item.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-[1fr_0.78fr] gap-5">
          <div className="border border-white/10 bg-carbon-950/60 p-4">
            <div className="flex h-44 items-end gap-3 border-b border-white/10 pb-3">
              {bars.map((bar, index) => (
                <motion.span
                  key={bar}
                  className="w-full bg-gradient-to-t from-electric to-acid"
                  style={{ height: `${bar}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.65, delay: 0.12 + index * 0.06 }}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between text-xs text-fog-500">
              <span>Analiz</span>
              <span>Optimizasyon</span>
              <span>Büyüme</span>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.045] p-4">
            <p className="text-sm font-bold text-white">Aktif büyüme akışı</p>
            <div className="mt-4 grid gap-3">
              {["Kreatif test", "Teklif optimizasyonu", "Landing page kontrolü", "Haftalık rapor"].map(
                (item, index) => (
                  <motion.div
                    key={item}
                    className="flex items-center gap-3 text-xs text-fog-300"
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.35 + index * 0.1 }}
                  >
                    <span className="size-2 bg-acid" />
                    {item}
                  </motion.div>
                )
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
