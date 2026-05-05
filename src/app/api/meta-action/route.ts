import { NextResponse } from "next/server";

type MetaActionRequest = {
  accessToken?: string;
  adAccountId?: string;
  action:
    | "create_campaign"
    | "update_campaign_status"
    | "update_adset_status"
    | "update_ad_status"
    | "update_adset_budget";
  campaignName?: string;
  objective?: string;
  status?: "ACTIVE" | "PAUSED";
  entityId?: string;
  dailyBudget?: string;
};

type MetaGraphError = {
  message?: string;
  type?: string;
  code?: number;
};

const META_API_VERSION = process.env.META_API_VERSION || "v23.0";

function normalizeAdAccountId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

function buildGraphUrl(endpoint: string) {
  return new URL(`https://graph.facebook.com/${META_API_VERSION}/${endpoint}`);
}

async function graphPost(endpoint: string, payload: Record<string, string>) {
  const response = await fetch(buildGraphUrl(endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: new URLSearchParams(payload),
    cache: "no-store"
  });
  const data = (await response.json()) as { id?: string; success?: boolean; error?: MetaGraphError };

  if (!response.ok || data.error) {
    throw {
      message: data.error?.message || "Meta aksiyonu uygulanamadı.",
      code: data.error?.code,
      type: data.error?.type,
      status: response.status || 400
    };
  }

  return data;
}

function objectiveToMeta(value?: string) {
  const map: Record<string, string> = {
    "Satış": "OUTCOME_SALES",
    "Lead toplama": "OUTCOME_LEADS",
    "Trafik": "OUTCOME_TRAFFIC",
    "Marka bilinirliği": "OUTCOME_AWARENESS",
    "Mesaj / WhatsApp": "OUTCOME_ENGAGEMENT"
  };

  return map[value || ""] || value || "OUTCOME_TRAFFIC";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MetaActionRequest;
    const accessToken = body.accessToken?.trim();

    if (!accessToken) {
      return NextResponse.json({ ok: false, message: "Meta aksiyonu için access token gerekli." }, { status: 400 });
    }

    if (body.action === "create_campaign") {
      const adAccountId = normalizeAdAccountId(body.adAccountId || "");
      const campaignName = body.campaignName?.trim();

      if (!adAccountId || !campaignName) {
        return NextResponse.json(
          { ok: false, message: "Kampanya oluşturmak için reklam hesabı ID ve kampanya adı gerekli." },
          { status: 400 }
        );
      }

      const result = await graphPost(`${adAccountId}/campaigns`, {
        access_token: accessToken,
        name: campaignName,
        objective: objectiveToMeta(body.objective),
        status: body.status || "PAUSED",
        special_ad_categories: "[]"
      });

      return NextResponse.json({
        ok: true,
        message: "Kampanya Meta reklam hesabında oluşturuldu.",
        id: result.id
      });
    }

    const entityId = body.entityId?.trim();

    if (!entityId) {
      return NextResponse.json({ ok: false, message: "Aksiyon için entity ID gerekli." }, { status: 400 });
    }

    if (body.action === "update_campaign_status" || body.action === "update_adset_status" || body.action === "update_ad_status") {
      const result = await graphPost(entityId, {
        access_token: accessToken,
        status: body.status || "PAUSED"
      });

      return NextResponse.json({
        ok: true,
        message: "Meta durumu güncellendi.",
        id: entityId,
        success: result.success ?? true
      });
    }

    if (body.action === "update_adset_budget") {
      const dailyBudget = body.dailyBudget?.trim();

      if (!dailyBudget || !/^\d+$/.test(dailyBudget)) {
        return NextResponse.json(
          { ok: false, message: "Ad set bütçesi kuruş/cent cinsinden tam sayı olmalı." },
          { status: 400 }
        );
      }

      const result = await graphPost(entityId, {
        access_token: accessToken,
        daily_budget: dailyBudget
      });

      return NextResponse.json({
        ok: true,
        message: "Ad set bütçesi güncellendi.",
        id: entityId,
        success: result.success ?? true
      });
    }

    return NextResponse.json({ ok: false, message: "Bilinmeyen Meta aksiyonu." }, { status: 400 });
  } catch (error) {
    const metaError = error as { message?: string; code?: number; type?: string; status?: number };

    return NextResponse.json(
      {
        ok: false,
        message: metaError.message || "Meta aksiyonu uygulanamadı.",
        code: metaError.code,
        type: metaError.type
      },
      { status: metaError.status || 500 }
    );
  }
}
