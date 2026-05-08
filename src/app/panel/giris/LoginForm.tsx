"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { verifyPassword } from "@/lib/local-password";
import {
  getSubscriptionDaysLeft,
  memberSessionStorageKey,
  membershipStorageKey,
  subscriptionStorageKey,
  type CustomerMembership,
  type CustomerSession,
  type SubscriptionState
} from "@/lib/subscription";

export function LoginForm() {
  const router = useRouter();
  const [membership, setMembership] = useState<CustomerMembership | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const storedMembership = window.localStorage.getItem(membershipStorageKey);
      const storedSubscription = window.localStorage.getItem(subscriptionStorageKey);
      const parsedMembership = storedMembership ? (JSON.parse(storedMembership) as CustomerMembership) : null;

      setMembership(parsedMembership);
      setSubscription(storedSubscription ? (JSON.parse(storedSubscription) as SubscriptionState) : null);
      setEmail(parsedMembership?.email || "");
    } catch {
      setMembership(null);
      setSubscription(null);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!membership) {
      setError("Panel girişi için önce abonelik sayfasından üyelik oluşturmanız gerekiyor.");
      return;
    }

    if (!subscription || getSubscriptionDaysLeft(subscription.expiresAt) <= 0) {
      setError("Abonelik süresi dolmuş veya plan bulunamadı. Lütfen planınızı yenileyin.");
      return;
    }

    if (email.trim().toLowerCase() !== membership.email.toLowerCase()) {
      setError("Bu e-posta ile aktif üyelik bulunamadı.");
      return;
    }

    if (!membership.passwordSalt || !membership.passwordHash) {
      setError("Bu üyelik eski akışla oluşturulmuş. Lütfen abonelik sayfasından üyeliği şifreyle yeniden aktif edin.");
      return;
    }

    const isPasswordValid = await verifyPassword(password, membership.passwordSalt, membership.passwordHash);

    if (!isPasswordValid) {
      setError("Şifre hatalı. Lütfen kayıt sırasında belirlediğiniz panel şifresini girin.");
      return;
    }

    setIsLoading(true);
    const session: CustomerSession = {
      email: membership.email,
      loggedInAt: new Date().toISOString()
    };
    window.localStorage.setItem(memberSessionStorageKey, JSON.stringify(session));
    window.sessionStorage.setItem(memberSessionStorageKey, JSON.stringify(session));

    window.setTimeout(() => {
      router.push("/panel");
    }, 450);
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {membership ? (
        <div className="rounded-lg border border-acid/25 bg-acid/10 p-4 text-sm leading-7 text-fog-100">
          <p className="font-black text-white">{membership.companyName} üyeliği aktif.</p>
          <p className="mt-1">Panele giriş için kayıtlı e-posta adresini kullanın.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-ember/25 bg-ember/10 p-4 text-sm leading-7 text-fog-200">
          Önce abonelik paketi seçip üyelik formunu tamamlamanız gerekir.
        </div>
      )}

      <label className="grid gap-2 text-sm font-semibold text-fog-100">
        Üyelik E-postası
        <input
          className="min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
          type="email"
          placeholder="ornek@akydijital.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-fog-100">
        Panel Şifresi
        <input
          className="min-w-0 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white placeholder:text-fog-500"
          type="password"
          placeholder="Kayıt sırasında belirlediğiniz şifre"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {error ? (
        <div className="rounded-lg border border-ember/25 bg-ember/10 px-4 py-3 text-sm leading-7 text-fog-200">
          {error}
        </div>
      ) : null}

      <button className="button-primary mt-2" type="submit" disabled={isLoading}>
        {isLoading ? "Panele yönlendiriliyor..." : "Panele Giriş Yap"}
        {isLoading ? <LockKeyhole className="size-4" /> : <ArrowRight className="size-4" />}
      </button>
      <Link href="/abonelik" className="button-secondary justify-center">
        Üyelik Oluştur / Plan Yenile
      </Link>
      <p className="text-xs leading-6 text-fog-500">
        Bu prototipte giriş, kayıtlı üyelik e-postası, şifre hash doğrulaması ve 30 günlük aktif plan kontrolüyle çalışır.
        Canlı sistemde SMS/e-posta OTP veya güvenli backend auth bağlanmalıdır.
      </p>
    </form>
  );
}
