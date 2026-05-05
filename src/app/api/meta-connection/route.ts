import { NextResponse } from "next/server";

type MetaAccountResponse = {
  id?: string;
  name?: string;
  account_status?: number;
  currency?: string;
  timezone_name?: string;
  amount_spent?: string;
  balance?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

const META_API_VERSION = process.env.META_API_VERSION || "v23.0";

function normalizeAdAccountId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

function getStatusLabel(status?: number) {
  const labels: Record<number, string> = {
    1: "Aktif",
    2: "Devre dışı",
    3: "Ödenmemiş bakiye",
    7: "İnceleme bekliyor",
    8: "Uzlaşma bekliyor",
    9: "Askıda",
    100: "Kapatıldı",
    101: "Silindi"
  };

  return typeof status === "number" ? labels[status] || `Durum kodu: ${status}` : "Bilinmiyor";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      accessToken?: string;
      adAccountId?: string;
    };

    const accessToken = body.accessToken?.trim();
    const adAccountId = normalizeAdAccountId(body.adAccountId || "");

    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Meta access token ve reklam hesabı ID alanlarını doldurun."
        },
        { status: 400 }
      );
    }

    const fields = [
      "id",
      "name",
      "account_status",
      "currency",
      "timezone_name",
      "amount_spent",
      "balance"
    ].join(",");
    const url = new URL(`https://graph.facebook.com/${META_API_VERSION}/${adAccountId}`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    const data = (await response.json()) as MetaAccountResponse;

    if (!response.ok || data.error) {
      return NextResponse.json(
        {
          ok: false,
          message:
            data.error?.message ||
            "Meta bağlantısı doğrulanamadı. Token izinlerini ve reklam hesabı ID bilgisini kontrol edin.",
          code: data.error?.code,
          type: data.error?.type
        },
        { status: response.status || 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Meta reklam hesabı bağlantısı başarıyla doğrulandı.",
      account: {
        id: data.id,
        name: data.name || adAccountId,
        status: getStatusLabel(data.account_status),
        currency: data.currency,
        timezone: data.timezone_name,
        amountSpent: data.amount_spent,
        balance: data.balance
      }
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Meta bağlantısı kontrol edilirken beklenmeyen bir hata oluştu."
      },
      { status: 500 }
    );
  }
}
