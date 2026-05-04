<?php

namespace App\Services;

class OpenAIImageService
{
    private string $apiKey;
    private string $projectRoot;
    private string $publicRoot;
    private string $sourceDir;
    private string $generatedDir;

    public function __construct()
    {
        $env = parse_ini_file(__DIR__ . '/../../.env');
        $this->apiKey = $env['OPENAI_API_KEY'] ?? '';

        $this->projectRoot = realpath(__DIR__ . '/../../') ?: dirname(__DIR__, 2);
        $this->publicRoot = $this->projectRoot . '/public';
        $this->sourceDir = $this->publicRoot . '/uploads/creatives/source';
        $this->generatedDir = $this->publicRoot . '/uploads/creatives/generated';
    }

    public function generateCreative(array $data, array $uploadedFile): array
    {
        if ($this->apiKey === '') {
            return [
                'success' => false,
                'error' => 'OpenAI API anahtarı bulunamadı. Lütfen .env dosyasına OPENAI_API_KEY ekleyin.',
            ];
        }

        $this->ensureDirectories();

        $sourceImage = $this->saveUploadedSource($uploadedFile);
        $prompt = $this->buildPrompt($data);

        $generatedBinary = $this->callOpenAIImage($prompt);

        $target = $this->normalizeTargetSize($data['size'] ?? '1080x1080');
        $generatedFilename = $this->generateFilename('creative_', 'png');
        $generatedAbsolutePath = $this->generatedDir . '/' . $generatedFilename;

        $this->resizeAndCropImageBlob(
            $generatedBinary,
            $generatedAbsolutePath,
            $target['width'],
            $target['height']
        );

        return [
            'success' => true,
            'source_absolute_path' => $sourceImage['absolute_path'],
            'source_web_path' => $sourceImage['web_path'],
            'generated_absolute_path' => $generatedAbsolutePath,
            'generated_web_path' => 'uploads/creatives/generated/' . $generatedFilename,
            'prompt' => $prompt,
        ];
    }

    private function ensureDirectories(): void
    {
        $directories = [
            $this->publicRoot . '/uploads',
            $this->publicRoot . '/uploads/creatives',
            $this->sourceDir,
            $this->generatedDir,
        ];

        foreach ($directories as $dir) {
            if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
                throw new \RuntimeException('Klasör oluşturulamadı: ' . $dir);
            }
        }
    }

    private function saveUploadedSource(array $uploadedFile): array
    {
        $errorCode = (int)($uploadedFile['error'] ?? UPLOAD_ERR_NO_FILE);

        if ($errorCode !== UPLOAD_ERR_OK) {
            throw new \RuntimeException('Ürün görseli yüklenemedi.');
        }

        $tmpName = $uploadedFile['tmp_name'] ?? '';
        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            throw new \RuntimeException('Geçersiz upload dosyası.');
        }

        $maxBytes = 10 * 1024 * 1024;
        $fileSize = (int)($uploadedFile['size'] ?? 0);

        if ($fileSize <= 0 || $fileSize > $maxBytes) {
            throw new \RuntimeException('Görsel boyutu en fazla 10 MB olabilir.');
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = $finfo ? (string)finfo_file($finfo, $tmpName) : '';
        if ($finfo) {
            finfo_close($finfo);
        }

        $allowedMimeMap = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!isset($allowedMimeMap[$mimeType])) {
            throw new \RuntimeException('Sadece JPG, PNG ve WEBP dosyaları yükleyebilirsin.');
        }

        $extension = $allowedMimeMap[$mimeType];
        $filename = $this->generateFilename('source_', $extension);
        $absolutePath = $this->sourceDir . '/' . $filename;

        if (!move_uploaded_file($tmpName, $absolutePath)) {
            throw new \RuntimeException('Yüklenen görsel sunucuya taşınamadı.');
        }

        return [
            'absolute_path' => $absolutePath,
            'web_path' => 'uploads/creatives/source/' . $filename,
            'mime_type' => $mimeType,
        ];
    }

    private function buildPrompt(array $data): string
    {
        $brandName = trim((string)($data['brand_name'] ?? ''));
        $productName = trim((string)($data['product_name'] ?? ''));
        $productDescription = trim((string)($data['product_description'] ?? ''));
        $adText = trim((string)($data['ad_text'] ?? ''));
        $headline = trim((string)($data['headline'] ?? ''));
        $ctaText = trim((string)($data['cta_text'] ?? ''));
        $targetAudience = trim((string)($data['target_audience'] ?? ''));
        $style = trim((string)($data['style'] ?? 'premium-minimal'));
        $size = trim((string)($data['size'] ?? '1080x1080'));

        $styleMap = [
            'premium-minimal' => 'premium, sade, temiz, modern, düzenli kompozisyon',
            'modern-ecommerce' => 'modern e-ticaret tasarımı, ürün odaklı, dönüşüm odaklı, temiz CTA alanı',
            'bold-conversion' => 'yüksek dikkat çeken, güçlü tipografi alanları olan, conversion odaklı tasarım',
            'luxury-clean' => 'lüks, zarif, temiz, premium ışık ve düzen hissi veren kompozisyon',
            'social-media' => 'sosyal medya dostu, dikkat çekici ama düzenli, mobil tüketim için optimize kompozisyon',
        ];

        $ratioHint = $size === '1080x1920'
            ? 'Dikey story/reels kullanımına uygun kompozisyon düşün.'
            : 'Kare sosyal medya post kullanımına uygun kompozisyon düşün.';

        $styleText = $styleMap[$style] ?? $styleMap['premium-minimal'];

        $prompt = "Meta reklam kreatifi için ürün odaklı bir reklam görseli üret.\n\n";
        $prompt .= "Kurallar:\n";
        $prompt .= "- Çıktı premium ve profesyonel görünmeli.\n";
        $prompt .= "- Ürün ana odak olmalı.\n";
        $prompt .= "- Kompozisyon temiz, dengeli ve ticari kalite hissi vermeli.\n";
        $prompt .= "- Aşırı kalabalık düzen kurma.\n";
        $prompt .= "- Gerçekçi ürün sunumu ve reklam estetiği kullan.\n";
        $prompt .= "- Metin yerleşimi için uygun boş alan hissi bırak.\n";
        $prompt .= "- Okunabilir, sade, yüksek performanslı reklam estetiği hedefle.\n";
        $prompt .= "- Kötü anatomi, bozuk obje, dağınık arka plan, düşük kalite, bulanıklık üretme.\n\n";

        $prompt .= "Marka: " . $brandName . "\n";
        $prompt .= "Ürün: " . $productName . "\n";
        $prompt .= "Ürün açıklaması: " . $productDescription . "\n";
        $prompt .= "Headline: " . $headline . "\n";
        $prompt .= "CTA: " . $ctaText . "\n";

        if ($adText !== '') {
            $prompt .= "Reklam metni: " . $adText . "\n";
        }

        if ($targetAudience !== '') {
            $prompt .= "Hedef kitle: " . $targetAudience . "\n";
        }

        $prompt .= "Tasarım stili: " . $styleText . "\n";
        $prompt .= "Yerleşim yönlendirmesi: " . $ratioHint . "\n";

        return $prompt;
    }

    private function callOpenAIImage(string $prompt): string
    {
        $payload = [
            'model' => 'gpt-image-1',
            'prompt' => $prompt,
            'size' => '1024x1024',
        ];

        $ch = curl_init('https://api.openai.com/v1/images/generations');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey,
            ],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT => 120,
        ]);

        $result = curl_exec($ch);

        if ($result === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new \RuntimeException('OpenAI bağlantı hatası: ' . $error);
        }

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($result, true);

        if ($httpCode >= 400) {
            $message = $data['error']['message'] ?? 'Bilinmeyen API hatası';
            throw new \RuntimeException('OpenAI image API hatası: ' . $message);
        }

        if (!empty($data['data'][0]['b64_json'])) {
            $decoded = base64_decode((string)$data['data'][0]['b64_json'], true);

            if ($decoded === false) {
                throw new \RuntimeException('OpenAI görsel çıktısı çözümlenemedi.');
            }

            return $decoded;
        }

        if (!empty($data['data'][0]['url'])) {
            $imageUrl = (string)$data['data'][0]['url'];
            $binary = @file_get_contents($imageUrl);

            if ($binary === false || $binary === '') {
                throw new \RuntimeException('Üretilen görsel indirilemedi.');
            }

            return $binary;
        }

        throw new \RuntimeException('OpenAI görsel çıktısı alınamadı.');
    }

    private function normalizeTargetSize(string $size): array
    {
        if ($size === '1080x1920') {
            return ['width' => 1080, 'height' => 1920];
        }

        return ['width' => 1080, 'height' => 1080];
    }

    private function resizeAndCropImageBlob(string $blob, string $targetPath, int $targetWidth, int $targetHeight): void
    {
        if (!function_exists('imagecreatefromstring')) {
            throw new \RuntimeException('GD kütüphanesi aktif değil. Sunucuda GD desteği gerekli.');
        }

        $sourceImage = @imagecreatefromstring($blob);
        if (!$sourceImage) {
            throw new \RuntimeException('Görsel verisi işlenemedi.');
        }

        $sourceWidth = imagesx($sourceImage);
        $sourceHeight = imagesy($sourceImage);

        if ($sourceWidth <= 0 || $sourceHeight <= 0) {
            imagedestroy($sourceImage);
            throw new \RuntimeException('Geçersiz görsel boyutu.');
        }

        $sourceRatio = $sourceWidth / $sourceHeight;
        $targetRatio = $targetWidth / $targetHeight;

        if ($sourceRatio > $targetRatio) {
            $cropHeight = $sourceHeight;
            $cropWidth = (int)round($sourceHeight * $targetRatio);
            $srcX = (int)round(($sourceWidth - $cropWidth) / 2);
            $srcY = 0;
        } else {
            $cropWidth = $sourceWidth;
            $cropHeight = (int)round($sourceWidth / $targetRatio);
            $srcX = 0;
            $srcY = (int)round(($sourceHeight - $cropHeight) / 2);
        }

        $targetImage = imagecreatetruecolor($targetWidth, $targetHeight);
        if (!$targetImage) {
            imagedestroy($sourceImage);
            throw new \RuntimeException('Hedef görsel oluşturulamadı.');
        }

        imagealphablending($targetImage, false);
        imagesavealpha($targetImage, true);
        $transparent = imagecolorallocatealpha($targetImage, 0, 0, 0, 127);
        imagefilledrectangle($targetImage, 0, 0, $targetWidth, $targetHeight, $transparent);

        $copied = imagecopyresampled(
            $targetImage,
            $sourceImage,
            0,
            0,
            $srcX,
            $srcY,
            $targetWidth,
            $targetHeight,
            $cropWidth,
            $cropHeight
        );

        imagedestroy($sourceImage);

        if (!$copied) {
            imagedestroy($targetImage);
            throw new \RuntimeException('Görsel yeniden boyutlandırılamadı.');
        }

        $saved = imagepng($targetImage, $targetPath, 9);
        imagedestroy($targetImage);

        if (!$saved) {
            throw new \RuntimeException('Görsel dosyası kaydedilemedi.');
        }
    }

    private function generateFilename(string $prefix, string $extension): string
    {
        return $prefix . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $extension;
    }
}