import { NextResponse } from "next/server";

type RequestBody = {
  message?: string;
  metrics?: unknown;
  campaigns?: unknown;
};

const fallbackAnswer =
  "AI ön analizi: En güçlü kampanyalar yüksek ROAS üreten remarketing ve Advantage+ akışları. Riskli alan düşük CTR ve yüksek CPC üreten soğuk kitle testi. İlk aksiyon olarak kreatif açısını yenileyin, remarketing bütçesini kontrollü artırın ve ROAS düşük kampanyaları ayrı bir test planına alın.";

export async function POST(request: Request) {
  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ answer: fallbackAnswer }, { status: 200 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.2";

  if (!apiKey) {
    return NextResponse.json({ answer: fallbackAnswer, mode: "fallback" }, { status: 200 });
  }

  const prompt = [
    "Aky Dijital Meta Ads AI paneli için Türkçe reklam performansı danışmanı gibi cevap ver.",
    "Kısa, net ve aksiyon odaklı ol. Bilmediğin veriyi uydurma.",
    `Kullanıcı sorusu: ${body.message || "Genel performansı yorumla."}`,
    `Metrikler: ${JSON.stringify(body.metrics ?? [])}`,
    `Kampanyalar: ${JSON.stringify(body.campaigns ?? [])}`,
    "Cevap formatı: 1 kısa özet + 3 maddelik aksiyon önerisi."
  ].join("\n\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: 550
      })
    });

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      return NextResponse.json(
        { answer: `AI yanıtı üretilemedi: ${data.error?.message || "API hatası"}`, mode: "error" },
        { status: 200 }
      );
    }

    const answer = data.output_text || data.output?.[0]?.content?.[0]?.text || fallbackAnswer;
    return NextResponse.json({ answer: answer.trim(), mode: "openai" }, { status: 200 });
  } catch {
    return NextResponse.json({ answer: fallbackAnswer, mode: "fallback" }, { status: 200 });
  }
}
