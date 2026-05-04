"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LogIn, Menu, PhoneCall, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { navItems } from "@/lib/content";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (pathname.startsWith("/panel")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-carbon-950/84 backdrop-blur-xl">
      <nav className="section-shell flex min-h-[4.5rem] items-center justify-between gap-3 lg:min-h-20 lg:gap-4">
        <Link href="/" className="min-w-0 shrink-0" aria-label="Aky Dijital ana sayfa">
          <BrandLogo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`button-ghost ${isActive ? "bg-white/[0.08] text-white" : "text-fog-400"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/panel/giris" className="button-secondary px-4">
            <LogIn className="size-4" />
            Giriş Yap
          </Link>
          <a href="tel:+905451781534" className="button-secondary px-4">
            <PhoneCall className="size-4" />
            Ara
          </a>
          <Link href="/iletisim" className="button-primary">
            Strateji Görüşmesi
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <button
          className="inline-flex size-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.045] text-white lg:hidden"
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label="Menüyü aç veya kapat"
        >
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {isOpen ? (
        <div id="mobile-menu" className="max-h-[calc(100svh-4.5rem)] overflow-y-auto border-t border-white/10 bg-carbon-950 lg:hidden">
          <div className="section-shell grid gap-2 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-fog-100 transition hover:bg-white/[0.08]"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/panel/giris"
              className="button-secondary mt-2 w-full"
              onClick={() => setIsOpen(false)}
            >
              Giriş Yap
              <LogIn className="size-4" />
            </Link>
            <Link
              href="/iletisim"
              className="button-primary mt-2 w-full"
              onClick={() => setIsOpen(false)}
            >
              Ücretsiz Strateji Görüşmesi Al
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
