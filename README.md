# Aky Dijital Website

Modern, responsive ve dönüşüm odaklı Aky Dijital ajans web sitesi.

## Teknoloji

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React

## Komutlar

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Yerel önizleme:

```text
http://127.0.0.1:3000
```

## Sayfalar

- `/`
- `/hizmetler`
- `/hakkimizda`
- `/sektorler`
- `/blog`
- `/iletisim`
- `/panel/giris`
- `/panel`

Stratejik marka, içerik, SEO ve geliştirici brief'i için `PROJECT_BRIEF.md` dosyasına bakın.

## AI Panel Entegrasyonu

- Giriş ekranı: `/panel/giris`
- Panel ekranı: `/panel`
- AI endpoint: `/api/panel-ai`

OpenAI yanıtlarını canlı kullanmak için yayın ortamında `OPENAI_API_KEY` tanımlayın. İsteğe bağlı model değişkeni:

```env
OPENAI_MODEL=gpt-5.2
```

Meta Ads PHP panelinin güvenli kaynak kopyası `integrations/meta-ads-panel-source` altında tutulur. `.env`, `vendor`, upload dosyaları ve loglar bu kopyaya dahil edilmemiştir.

## Marka Varlıkları

- Yatay logo: `public/brand/aky-dijital-logo.svg`
- Logo işareti: `public/brand/aky-dijital-mark.svg`
- Favicon/app icon: `src/app/icon.svg`
