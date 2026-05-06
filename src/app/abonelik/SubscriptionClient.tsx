"use client";

import Link from "next/link";
import { CheckCircle2, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import {
  subscriptionCycleDays,
  subscriptionPlans,
  subscriptionStorageKey,
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
  function activatePlan(planId: SubscriptionPlanId) {
    window.localStorage.setItem(subscriptionStorageKey, JSON.stringify(buildSubscription(planId)));
    window.location.href = "/panel";
  }

  return (
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

          <button className="button-primary mt-6 w-full justify-center" type="button" onClick={() => activatePlan(plan.id)}>
            Abone Ol
            <CreditCard className="size-4" />
          </button>
        </article>
      ))}

      <div className="rounded-lg border border-white/10 bg-carbon-900/70 p-5 lg:col-span-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 size-5 shrink-0 text-acid" />
            <div>
              <h3 className="text-lg font-black text-white">30 günlük abonelik döngüsü</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-fog-400">
                Her plan 30 günlük panel erişimi açar. Süre bittiğinde kullanıcı paneli göremez; aynı veya daha yüksek
                bir plan yenilendiğinde sayaç yeniden 30 günden başlar.
              </p>
            </div>
          </div>
          <Link href="/panel" className="button-secondary w-full justify-center lg:w-auto">
            Panele Git
          </Link>
        </div>
      </div>
    </div>
  );
}
