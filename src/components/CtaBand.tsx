import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";

type CtaBandProps = {
  title?: string;
  text?: string;
  variant?: "light" | "dark";
};

export function CtaBand({
  title = "Dijital büyüme planınızı netleştirelim.",
  text = "15 dakikalık ücretsiz strateji görüşmesinde hedefinizi, bütçenizi ve en hızlı kazanım fırsatlarını birlikte değerlendirelim.",
  variant = "light"
}: CtaBandProps) {
  const isDark = variant === "dark";

  return (
    <section className="section-shell pb-16 sm:pb-20 lg:pb-24">
      <div
        className={`relative overflow-hidden rounded-lg p-6 sm:p-8 lg:p-10 ${
          isDark
            ? "border border-electric/20 bg-carbon-900/80 text-white shadow-glow"
            : "border border-acid/25 bg-fog-50 text-carbon-950 shadow-acid"
        }`}
      >
        <div
          className={`absolute inset-y-0 right-0 hidden w-1/2 bg-signal-lines lg:block ${
            isDark ? "opacity-10" : "opacity-25"
          }`}
        />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.18em] ${
                isDark ? "text-acid" : "text-carbon-800"
              }`}
            >
              Final CTA
            </p>
            <h2 className="mt-3 max-w-2xl text-[clamp(1.9rem,7vw,2.5rem)] font-black leading-[1.08] tracking-normal">
              {title}
            </h2>
            <p className={`mt-4 max-w-2xl text-base leading-8 ${isDark ? "text-fog-300" : "text-carbon-800"}`}>
              {text}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/iletisim"
              className={
                isDark
                  ? "button-primary"
                  : "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-carbon-950 px-4 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-carbon-800 sm:w-auto sm:px-5"
              }
            >
              Ücretsiz Strateji Görüşmesi Al
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="https://wa.me/905451781534"
              target="_blank"
              rel="noreferrer"
              className={
                isDark
                  ? "button-secondary"
                  : "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-carbon-950/15 px-4 py-3 text-center text-sm font-bold text-carbon-950 transition hover:-translate-y-0.5 hover:bg-carbon-950/5 sm:w-auto sm:px-5"
              }
            >
              WhatsApp’tan Yaz
              <Send className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
