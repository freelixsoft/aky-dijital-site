"use client";

import Link from "next/link";
import { CheckCircle2, CreditCard, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { createPasswordVerifier } from "@/lib/local-password";
import {
  memberSessionStorageKey,
  membershipStorageKey,
  subscriptionCycleDays,
  subscriptionPlans,
  subscriptionStorageKey,
  type CustomerMembership,
  type SubscriptionPlanId,
  type SubscriptionState
} from "@/lib/subscription";

function buildSubscription(planId: SubscriptionPlanId): SubscriptionState {
  const startedAt = new Date();
  const expiresAt = new Date(startedAt);
  expiresAt.setDate(expiresAt.getDate() + subscriptionCycleDays);

  return {
    planId,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
}

export function SubscriptionClient() {
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");
  const selectedPlan = subscriptionPlans.find((plan) => plan.id === selectedPlanId);

  async function handleMembershipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) return;
    setFormError("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const passwordConfirm = String(form.get("passwordConfirm") || "");

    if (password.length < 8) {
      setFormError("Şifre en az 8 karakter olmalı.");
      return;
    }

    if (password !== passwordConfirm) {
      setFormError("Şifreler eşleşmiyor.");
      return;
    }

    const passwordVerifier = await createPasswordVerifier(password);
    const membership: CustomerMembership = {
      fullName: String(form.get("fullName") || ""),
      email: String(form.get("email") || "").trim().toLowerCase(),
      phone: String(form.get("phone") || ""),
      ...passwordVerifier,
      companyName: String(form.get("companyName") || ""),
      website: String(form.get("website") || ""),
      sector: String(form.get("sector") || ""),
      taxTitle: String(form.get("taxTitle") || ""),
      city: String(form.get("city") || ""),
      monthlyAdBudget: String(form.get("monthlyAdBudget") || ""),
      target: String(form.get("target") || ""),
      selectedPlanId: selectedPlan.id,
      createdAt: new Date().toISOString(),
      status: "active"
    };

    window.localStorage.setItem(membershipStorageKey, JSON.stringify(membership));
    window.localStorage.setItem(subscriptionStorageKey, JSON.stringify(buildSubscription(selectedPlan.id)));
    window.sessionStorage.removeItem(memberSessionStorageKey);
    setSuccessMessage("Üyeliğiniz aktif edildi. Paneli kullanmak için giriş ekranına yönlendiriliyorsunuz.");

    window.setTimeout(() => {
      window.location.href = "/panel/giris";
    }, 900);
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-5 lg:grid-cols-3">
        {subscriptionPlans.map((plan) => (
          <article key={plan.id} className="surface flex min-h-full flex-col rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">{plan.badge}</p>
                <h2 className="mt-3 text-2xl font-black text-white">{plan.name}</h2>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-acid/25 bg-acid/10 text-acid">
                <Sparkles className="size-5" />
              </span>
            </div>

            <div className="mt-5">
              <span className="text-4xl font-black text-white">${plan.priceUsd}</span>
              <span className="ml-2 text-sm font-semibold text-fog-400">/ 30 gün</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-fog-400">{plan.summary}</p>

            <div className="mt-5 rounded-lg border border-white/10 bg-carbon-950/70 p-4">
              <p className="text-sm font-black text-white">{plan.adAccountLimit} reklam hesabı</p>
              <p className="mt-1 text-xs leading-6 text-fog-500">Plan yenilenmezse panel erişimi otomatik kilitlenir.</p>
            </div>

            <div className="mt-5 grid gap-3 text-sm leading-6 text-fog-300">
              {plan.features.map((feature) => (
                <span key={feature} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-acid" />
                  {feature}
                </span>
              ))}
            </div>

            <button className="button-primary mt-6 w-full justify-center" type="button" onClick={() => setSelectedPlanId(plan.id)}>
              Abone Ol
              <UserRound className="size-4" />
            </button>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-carbon-900/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 size-5 shrink-0 text-acid" />
            <div>
              <h3 className="text-lg font-black text-white">Üyelik + 30 günlük abonelik döngüsü</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-fog-400">
                Paket seçildikten sonra müşteri bilgileri alınır, üyelik aktif edilir ve kullanıcı giriş ekranından panele
                girer. Şifre düz metin saklanmaz; bu prototipte salt + hash ile doğrulanır. Canlı sistemde güvenli backend auth bağlanmalıdır.
              </p>
            </div>
          </div>
          <Link href="/panel/giris" className="button-secondary w-full justify-center lg:w-auto">
            Giriş Ekranı
          </Link>
        </div>
      </div>

      {selectedPlan ? (
        <div id="uyelik-formu" className="surface rounded-lg p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-acid">Üyelik bilgileri</p>
              <h2 className="mt-2 text-2xl font-black text-white">{selectedPlan.name} planı için müşteri hesabı</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-fog-400">
                Önce müşteri hesabını oluşturun. Üyelik aktif edildikten sonra giriş ekranından kayıtlı e-posta ile
                oturum açılır ve panel kullanımı başlar.
              </p>
            </div>
            <span className="rounded-lg border border-acid/25 bg-acid/10 px-3 py-2 text-sm font-black text-acid">
              ${selectedPlan.priceUsd} / 30 gün
            </span>
          </div>

          <form className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={handleMembershipSubmit}>
            <label className="grid gap-2 text-sm font-semibold text-fog-100">
              Yetkili Ad Soyad
              <input name="fullName" required className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fog-100">
              E-posta
              <input name="email" type="email" required className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fog-100">
              Telefon
              <input name="phone" required className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fog-100">
              Panel Şifresi
              <input name="password" type="password" minLength={8} required className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fog-100">
              Şifre Tekrarı
              <input name="passwordConfirm" type="password" minLength={8} required className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fog-100">
              Firma / Marka Adı
              <input name="companyName" required className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fog-100">
              Web Sitesi
              <input name="website" placeholder="https://..." className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fog-100">
              Sektör
              <input name="sector" required className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fog-100">
              Şehir
              <input name="city" required className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fog-100">
              Fatura Ünvanı
              <input name="taxTitle" className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fog-100">
              Aylık Reklam Bütçesi
              <input name="monthlyAdBudget" placeholder="Örn: 50.000 TL" required className="min-h-12 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fog-100 lg:col-span-2">
              Panelden Beklenen Ana Hedef
              <textarea name="target" required className="min-h-28 rounded-lg border border-white/10 bg-carbon-950 px-4 py-3 text-white" placeholder="Örn: satış kampanyalarını takip etmek, müşteri adaylarını artırmak, bütçe kontrolü yapmak..." />
            </label>
            <div className="lg:col-span-2">
              <button className="button-primary" type="submit">
                Üyeliği Aktif Et ve Girişe Git
                <CreditCard className="size-4" />
              </button>
            </div>
          </form>
          {formError ? (
            <div className="mt-5 rounded-lg border border-ember/25 bg-ember/10 p-4 text-sm font-semibold text-fog-100">
              {formError}
            </div>
          ) : null}
          {successMessage ? (
            <div className="mt-5 rounded-lg border border-acid/25 bg-acid/10 p-4 text-sm font-semibold text-fog-100">
              {successMessage}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
