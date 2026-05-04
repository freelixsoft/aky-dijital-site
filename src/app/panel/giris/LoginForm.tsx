"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    window.sessionStorage.setItem("aky-panel-preview", "true");
    window.setTimeout(() => {
      router.push("/panel");
    }, 450);
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-fog-100">
        E-posta
        <input
          className="min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
          type="email"
          placeholder="ornek@akydijital.com"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-fog-100">
        Şifre
        <input
          className="min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
          type="password"
          placeholder="Şifrenizi girin"
          required
        />
      </label>
      <button className="button-primary mt-2" type="submit" disabled={isLoading}>
        {isLoading ? "Panele yönlendiriliyor..." : "Giriş Yap"}
        {isLoading ? <LockKeyhole className="size-4" /> : <ArrowRight className="size-4" />}
      </button>
      <p className="text-xs leading-6 text-fog-500">
        Bu ekran Aky Dijital web sitesiyle uyumlu panel giriş deneyimidir. Canlı sistemde
        PHP/Meta Ads backend veya seçilecek auth altyapısı buraya bağlanabilir.
      </p>
    </form>
  );
}
