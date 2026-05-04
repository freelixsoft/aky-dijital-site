<?php

namespace App\Services;

class OpenAIAnalysisService
{
    private string $apiKey;

    public function __construct()
    {
        $env = parse_ini_file(__DIR__ . '/../../.env');
        $this->apiKey = $env['OPENAI_API_KEY'] ?? '';
    }

    public function generateDashboardAnalysis(array $campaignData, array $summary): string
    {
        if ($this->apiKey === '') {
            return 'OpenAI API anahtarı bulunamadı. Lütfen .env dosyasına OPENAI_API_KEY ekleyin.';
        }

        $topCampaigns = array_slice($campaignData, 0, 8);

        $campaignLines = [];
        foreach ($topCampaigns as $campaign) {
            $campaignLines[] = sprintf(
                "- %s | Harcama: %s | Tıklama: %s | CTR: %s%% | CPC: %s | Sonuç: %s | ROAS: %s",
                $campaign['campaign_name'] ?? '-',
                number_format((float)($campaign['spend'] ?? 0), 2, '.', ''),
                number_format((int)($campaign['clicks'] ?? 0), 0, '.', ''),
                number_format((float)($campaign['ctr'] ?? 0), 2, '.', ''),
                number_format((float)($campaign['cpc'] ?? 0), 2, '.', ''),
                number_format((float)($campaign['results_count'] ?? 0), 0, '.', ''),
                number_format((float)($campaign['roas_value'] ?? 0), 2, '.', '')
            );
        }

        $prompt = "Aşağıdaki Meta reklam verilerini analiz et ve Türkçe, net, kısa ama faydalı bir yönetici özeti üret.\n\n"
            . "Kurallar:\n"
            . "1. 5 maddelik çıktı üret.\n"
            . "2. İlk madde genel performans özeti olsun.\n"
            . "3. En iyi kampanyayı belirt.\n"
            . "4. En sorunlu kampanyayı belirt.\n"
            . "5. En fazla 3 net optimizasyon önerisi ver.\n"
            . "6. Cevap tamamen Türkçe olsun.\n"
            . "7. Markdown başlık kullanma, düz madde işaretleri kullan.\n\n"
            . "Genel Özet:\n"
            . "- Toplam Harcama: " . number_format((float)$summary['total_spend'], 2, '.', '') . "\n"
            . "- Toplam Gösterim: " . number_format((int)$summary['total_impressions'], 0, '.', '') . "\n"
            . "- Toplam Tıklama: " . number_format((int)$summary['total_clicks'], 0, '.', '') . "\n"
            . "- Toplam Sonuç: " . number_format((float)$summary['total_results'], 0, '.', '') . "\n"
            . "- Ortalama CTR: " . number_format((float)$summary['avg_ctr'], 2, '.', '') . "\n"
            . "- Ortalama ROAS: " . number_format((float)$summary['avg_roas'], 2, '.', '') . "\n\n"
            . "Kampanyalar:\n" . implode("\n", $campaignLines);

        return $this->callOpenAI($prompt, 500);
    }

    public function generateCampaignAnalysis(array $campaign, array $adSets): string
    {
        if ($this->apiKey === '') {
            return 'OpenAI API anahtarı bulunamadı. Lütfen .env dosyasına OPENAI_API_KEY ekleyin.';
        }

        $adSetLines = [];
        foreach (array_slice($adSets, 0, 10) as $adSet) {
            $adSetLines[] = sprintf(
                "- %s | Harcama: %s | CTR: %s%% | CPC: %s | Sonuç: %s | ROAS: %s",
                $adSet['adset_name'] ?? '-',
                number_format((float)($adSet['spend'] ?? 0), 2, '.', ''),
                number_format((float)($adSet['ctr'] ?? 0), 2, '.', ''),
                number_format((float)($adSet['cpc'] ?? 0), 2, '.', ''),
                number_format((float)($adSet['results_count'] ?? 0), 0, '.', ''),
                number_format((float)($adSet['roas_value'] ?? 0), 2, '.', '')
            );
        }

        $prompt = "Aşağıdaki kampanya ve altındaki ad set verilerini analiz et.\n"
            . "Türkçe yaz. 4-6 maddelik, kısa ama uzman yorumu üret.\n"
            . "Şunları mutlaka değerlendir: kampanyanın genel durumu, en güçlü ad set, en problemli ad set, bütçe/kreatif/hedefleme önerisi.\n\n"
            . "Kampanya:\n"
            . "- Ad: " . ($campaign['campaign_name'] ?? '-') . "\n"
            . "- Harcama: " . number_format((float)($campaign['spend'] ?? 0), 2, '.', '') . "\n"
            . "- Gösterim: " . number_format((int)($campaign['impressions'] ?? 0), 0, '.', '') . "\n"
            . "- Tıklama: " . number_format((int)($campaign['clicks'] ?? 0), 0, '.', '') . "\n"
            . "- CTR: " . number_format((float)($campaign['ctr'] ?? 0), 2, '.', '') . "\n"
            . "- CPC: " . number_format((float)($campaign['cpc'] ?? 0), 2, '.', '') . "\n"
            . "- Sonuç: " . number_format((float)($campaign['results_count'] ?? 0), 0, '.', '') . "\n"
            . "- ROAS: " . number_format((float)($campaign['roas_value'] ?? 0), 2, '.', '') . "\n\n"
            . "Ad setler:\n" . implode("\n", $adSetLines);

        return $this->callOpenAI($prompt, 500);
    }

    public function generateAdSetAnalysis(array $adSet, array $ads): string
    {
        if ($this->apiKey === '') {
            return 'OpenAI API anahtarı bulunamadı. Lütfen .env dosyasına OPENAI_API_KEY ekleyin.';
        }

        $adLines = [];
        foreach (array_slice($ads, 0, 12) as $ad) {
            $adLines[] = sprintf(
                "- %s | Harcama: %s | CTR: %s%% | CPC: %s | Sonuç: %s | ROAS: %s",
                $ad['ad_name'] ?? '-',
                number_format((float)($ad['spend'] ?? 0), 2, '.', ''),
                number_format((float)($ad['ctr'] ?? 0), 2, '.', ''),
                number_format((float)($ad['cpc'] ?? 0), 2, '.', ''),
                number_format((float)($ad['results_count'] ?? 0), 0, '.', ''),
                number_format((float)($ad['roas_value'] ?? 0), 2, '.', '')
            );
        }

        $prompt = "Aşağıdaki ad set ve altındaki reklam verilerini analiz et.\n"
            . "Türkçe yaz. 4-6 maddelik net optimizasyon özeti üret.\n"
            . "Şunları değerlendir: ad set genel durumu, en iyi reklam, en kötü reklam, kreatif veya hedefleme problemi olup olmadığı, uygulanabilir öneriler.\n\n"
            . "Ad Set:\n"
            . "- Ad: " . ($adSet['adset_name'] ?? '-') . "\n"
            . "- Harcama: " . number_format((float)($adSet['spend'] ?? 0), 2, '.', '') . "\n"
            . "- Gösterim: " . number_format((int)($adSet['impressions'] ?? 0), 0, '.', '') . "\n"
            . "- Tıklama: " . number_format((int)($adSet['clicks'] ?? 0), 0, '.', '') . "\n"
            . "- CTR: " . number_format((float)($adSet['ctr'] ?? 0), 2, '.', '') . "\n"
            . "- CPC: " . number_format((float)($adSet['cpc'] ?? 0), 2, '.', '') . "\n"
            . "- Sonuç: " . number_format((float)($adSet['results_count'] ?? 0), 0, '.', '') . "\n"
            . "- ROAS: " . number_format((float)($adSet['roas_value'] ?? 0), 2, '.', '') . "\n\n"
            . "Reklamlar:\n" . implode("\n", $adLines);

        return $this->callOpenAI($prompt, 500);
    }

    public function generateSingleAdAnalysis(array $adSet, array $ad): string
    {
        if ($this->apiKey === '') {
            return 'OpenAI API anahtarı bulunamadı. Lütfen .env dosyasına OPENAI_API_KEY ekleyin.';
        }

        $prompt = "Aşağıdaki tekil reklam performansını analiz et.\n"
            . "Türkçe yaz. 4-5 kısa ama net madde üret.\n"
            . "Şunları değerlendir: reklamın genel durumu, kreatif performansı hakkında çıkarım, tıklama kalitesi, dönüşüm verimliliği, uygulanabilir aksiyon.\n"
            . "Boş yere genel konuşma yapma. Veriye dayalı kal.\n\n"
            . "Ad Set Bağlamı:\n"
            . "- Ad Set: " . ($adSet['adset_name'] ?? '-') . "\n"
            . "- Ad Set CTR: " . number_format((float)($adSet['ctr'] ?? 0), 2, '.', '') . "\n"
            . "- Ad Set Sonuç: " . number_format((float)($adSet['results_count'] ?? 0), 0, '.', '') . "\n"
            . "- Ad Set ROAS: " . number_format((float)($adSet['roas_value'] ?? 0), 2, '.', '') . "\n\n"
            . "Reklam Verisi:\n"
            . "- Reklam Adı: " . ($ad['ad_name'] ?? '-') . "\n"
            . "- Harcama: " . number_format((float)($ad['spend'] ?? 0), 2, '.', '') . "\n"
            . "- Gösterim: " . number_format((int)($ad['impressions'] ?? 0), 0, '.', '') . "\n"
            . "- Tıklama: " . number_format((int)($ad['clicks'] ?? 0), 0, '.', '') . "\n"
            . "- CTR: " . number_format((float)($ad['ctr'] ?? 0), 2, '.', '') . "\n"
            . "- CPC: " . number_format((float)($ad['cpc'] ?? 0), 2, '.', '') . "\n"
            . "- CPM: " . number_format((float)($ad['cpm'] ?? 0), 2, '.', '') . "\n"
            . "- Sonuç: " . number_format((float)($ad['results_count'] ?? 0), 0, '.', '') . "\n"
            . "- ROAS: " . number_format((float)($ad['roas_value'] ?? 0), 2, '.', '');

        return $this->callOpenAI($prompt, 450);
    }

    public function generateChatReply(string $systemContext, array $history, string $userMessage): string
    {
        if ($this->apiKey === '') {
            return 'OpenAI API anahtarı bulunamadı. Lütfen .env dosyasına OPENAI_API_KEY ekleyin.';
        }

        $conversationText = "Sistem Bağlamı:\n" . $systemContext . "\n\n";
        $conversationText .= "Konuşma Geçmişi:\n";

        foreach ($history as $message) {
            $role = $message['role'] === 'assistant' ? 'Asistan' : 'Kullanıcı';
            $conversationText .= $role . ": " . ($message['content'] ?? '') . "\n";
        }

        $conversationText .= "\nKullanıcı: " . $userMessage . "\n\n";
        $conversationText .= "Görev:\n";
        $conversationText .= "- Meta reklam danışmanı gibi cevap ver.\n";
        $conversationText .= "- Türkçe yaz.\n";
        $conversationText .= "- Mümkünse veriye dayalı konuş.\n";
        $conversationText .= "- Gerekirse maddeler halinde kısa aksiyon önerileri ver.\n";
        $conversationText .= "- Bilmediğin şeyi uydurma.\n";

        return $this->callOpenAI($conversationText, 700);
    }

    private function callOpenAI(string $prompt, int $maxOutputTokens = 500): string
    {
        $payload = [
            'model' => 'gpt-5.2',
            'input' => $prompt,
            'max_output_tokens' => $maxOutputTokens
        ];

        $ch = curl_init('https://api.openai.com/v1/responses');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey,
            ],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT => 60,
        ]);

        $result = curl_exec($ch);

        if ($result === false) {
            $error = curl_error($ch);
            curl_close($ch);
            return 'OpenAI bağlantı hatası: ' . $error;
        }

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($result, true);

        if ($httpCode >= 400) {
            $message = $data['error']['message'] ?? 'Bilinmeyen API hatası';
            return 'OpenAI API hatası: ' . $message;
        }

        if (!empty($data['output_text'])) {
            return trim($data['output_text']);
        }

        if (!empty($data['output'][0]['content'][0]['text'])) {
            return trim($data['output'][0]['content'][0]['text']);
        }

        return 'AI yanıtı üretilemedi.';
    }
}