import { NextResponse } from "next/server";

type CreativeImageRequest = {
  product?: string;
  audience?: string;
  format?: string;
  brief?: string;
  campaignContext?: unknown;
};

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
  };
};

function imageRequestBody(model: string, prompt: string) {
  if (model.startsWith("dall-e-3")) {
    return {
      model,
      prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1
    };
  }

  return {
    model,
    prompt,
    size: "1024x1024",
    quality: "low",
    n: 1
  };
}

function buildPrompt(body: CreativeImageRequest) {
  return [
    "Create a premium performance marketing ad visual for Aky Dijital.",
    "Style: modern Turkish digital agency, dark anthracite background, electric blue and acid green accents, realistic product/service advertising composition, no fake UI text blocks, no clutter.",
    `Product or service: ${body.product || "digital marketing service"}.`,
    `Target audience: ${body.audience || "business owners and marketing managers"}.`,
    `Ad format: ${body.format || "social media feed visual"}.`,
    body.brief ? `Creative brief: ${body.brief}.` : "",
    body.campaignContext ? `Live campaign context: ${JSON.stringify(body.campaignContext).slice(0, 1800)}.` : "",
    "Avoid copyrighted logos and avoid adding unreadable text. Leave clean space for overlay copy."
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreativeImageRequest;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          message: "Görsel üretimi için OPENAI_API_KEY tanımlı değil."
        },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(body);
    const models = Array.from(
      new Set([process.env.OPENAI_IMAGE_MODEL || "gpt-image-2", "gpt-image-1.5", "gpt-image-1", "dall-e-3"])
    );
    let lastMessage = "AI görseli üretilemedi.";

    for (const model of models) {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(imageRequestBody(model, prompt))
      });
      const data = (await response.json()) as OpenAIImageResponse;

      if (!response.ok || data.error) {
        lastMessage = data.error?.message || lastMessage;
        continue;
      }

      const image = data.data?.[0];
      const imageUrl = image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url;

      if (imageUrl) {
        return NextResponse.json({
          ok: true,
          message: "AI kreatif görseli üretildi.",
          imageUrl,
          model
        });
      }
    }

    return NextResponse.json({ ok: false, message: lastMessage }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, message: "AI görsel üretimi sırasında beklenmeyen hata oluştu." }, { status: 500 });
  }
}
