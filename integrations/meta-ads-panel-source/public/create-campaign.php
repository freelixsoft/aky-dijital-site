<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/helpers/auth.php';

requireLogin();

use App\Models\MetaConnection;
use App\Services\MetaAdsService;

$db = require __DIR__ . '/../app/config/database.php';

$user = $_SESSION['user'];

$metaConnectionModel = new MetaConnection($db);
$connection = $metaConnectionModel->getByUserId((int)$user['id']);

$mesaj = '';
$hata = '';

$createdCampaignId = '';
$createdAdSetIds = [];
$createdCreativeIds = [];
$createdAdIds = [];

$form = [
    'campaign_name' => '',
    'objective' => 'OUTCOME_TRAFFIC',
    'campaign_status' => 'ACTIVE',
    'adsets' => [
        [
            'name' => '',
            'daily_budget' => '1000',
            'billing_event' => 'IMPRESSIONS',
            'optimization_goal' => 'LINK_CLICKS',
            'bid_strategy' => 'LOWEST_COST_WITHOUT_CAP',
            'status' => 'ACTIVE',
            'country' => 'TR',
            'min_age' => '18',
            'max_age' => '65',
            'gender' => 'all',
            'pixel_id' => '',
            'custom_event_type' => 'LEAD',
            'start_time' => date('c', strtotime('+1 hour')),
            'end_time' => '',
            'ads' => [
                [
                    'media_type' => 'image',
                    'creative_source' => '',
                    'video_source' => '',
                    'page_id' => '',
                    'ad_name' => '',
                    'destination_url' => '',
                    'primary_text' => '',
                    'ad_headline' => '',
                    'ad_description' => '',
                    'cta_type' => 'LEARN_MORE',
                    'ad_status' => 'ACTIVE',
                ]
            ],
        ]
    ],
];

function normalizeAdSets(array $inputAdSets): array
{
    $normalized = [];

    foreach ($inputAdSets as $adSet) {
        $adsInput = $adSet['ads'] ?? [];
        $ads = [];

        if (is_array($adsInput)) {
            foreach ($adsInput as $ad) {
                $ads[] = [
                    'media_type' => trim((string)($ad['media_type'] ?? 'image')),
                    'creative_source' => trim((string)($ad['creative_source'] ?? '')),
                    'video_source' => trim((string)($ad['video_source'] ?? '')),
                    'page_id' => trim((string)($ad['page_id'] ?? '')),
                    'ad_name' => trim((string)($ad['ad_name'] ?? '')),
                    'destination_url' => trim((string)($ad['destination_url'] ?? '')),
                    'primary_text' => trim((string)($ad['primary_text'] ?? '')),
                    'ad_headline' => trim((string)($ad['ad_headline'] ?? '')),
                    'ad_description' => trim((string)($ad['ad_description'] ?? '')),
                    'cta_type' => trim((string)($ad['cta_type'] ?? 'LEARN_MORE')),
                    'ad_status' => trim((string)($ad['ad_status'] ?? 'ACTIVE')),
                ];
            }
        }

        if (empty($ads)) {
            $ads[] = [
                'media_type' => 'image',
                'creative_source' => '',
                'video_source' => '',
                'page_id' => '',
                'ad_name' => '',
                'destination_url' => '',
                'primary_text' => '',
                'ad_headline' => '',
                'ad_description' => '',
                'cta_type' => 'LEARN_MORE',
                'ad_status' => 'ACTIVE',
            ];
        }

        $normalized[] = [
            'name' => trim((string)($adSet['name'] ?? '')),
            'daily_budget' => trim((string)($adSet['daily_budget'] ?? '1000')),
            'billing_event' => trim((string)($adSet['billing_event'] ?? 'IMPRESSIONS')),
            'optimization_goal' => trim((string)($adSet['optimization_goal'] ?? 'LINK_CLICKS')),
            'bid_strategy' => trim((string)($adSet['bid_strategy'] ?? 'LOWEST_COST_WITHOUT_CAP')),
            'status' => trim((string)($adSet['status'] ?? 'ACTIVE')),
            'country' => trim((string)($adSet['country'] ?? 'TR')),
            'min_age' => trim((string)($adSet['min_age'] ?? '18')),
            'max_age' => trim((string)($adSet['max_age'] ?? '65')),
            'gender' => trim((string)($adSet['gender'] ?? 'all')),
            'pixel_id' => trim((string)($adSet['pixel_id'] ?? '')),
            'custom_event_type' => trim((string)($adSet['custom_event_type'] ?? 'LEAD')),
            'start_time' => trim((string)($adSet['start_time'] ?? date('c', strtotime('+1 hour')))),
            'end_time' => trim((string)($adSet['end_time'] ?? '')),
            'ads' => $ads,
        ];
    }

    return empty($normalized) ? $GLOBALS['form']['adsets'] : $normalized;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $form['campaign_name'] = trim($_POST['campaign_name'] ?? '');
    $form['objective'] = trim($_POST['objective'] ?? 'OUTCOME_TRAFFIC');
    $form['campaign_status'] = trim($_POST['campaign_status'] ?? 'ACTIVE');
    $form['adsets'] = normalizeAdSets($_POST['adsets'] ?? []);

    if (!$connection) {
        $hata = 'Önce dashboard üzerinden Meta bağlantısını kaydetmen gerekiyor.';
    } elseif ($form['campaign_name'] === '') {
        $hata = 'Kampanya adı zorunlu.';
    } elseif (empty($form['adsets'])) {
        $hata = 'En az 1 ad set gerekli.';
    } else {
        try {
            foreach ($form['adsets'] as $adSetIndex => $adSet) {
                if ($adSet['name'] === '') {
                    throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' adı zorunlu.');
                }

                if ($adSet['daily_budget'] === '' || !ctype_digit($adSet['daily_budget'])) {
                    throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' günlük bütçesi tam sayı olmalı.');
                }

                if ($adSet['country'] === '') {
                    throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' ülke kodu zorunlu.');
                }

                if ((int)$adSet['min_age'] < 13 || (int)$adSet['max_age'] < (int)$adSet['min_age']) {
                    throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' yaş aralığı geçersiz.');
                }

                if (in_array($form['objective'], ['OUTCOME_LEADS', 'OUTCOME_SALES'], true) && $adSet['pixel_id'] === '') {
                    throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' için Pixel ID zorunlu.');
                }

                if (empty($adSet['ads'])) {
                    throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' altında en az 1 reklam olmalı.');
                }

                foreach ($adSet['ads'] as $adIndex => $ad) {
                    if ($ad['page_id'] === '') {
                        throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' / Reklam #' . ($adIndex + 1) . ' için Page ID zorunlu.');
                    }
                    if ($ad['ad_name'] === '') {
                        throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' / Reklam #' . ($adIndex + 1) . ' adı zorunlu.');
                    }
                    if ($ad['destination_url'] === '') {
                        throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' / Reklam #' . ($adIndex + 1) . ' destination URL zorunlu.');
                    }
                    if ($ad['primary_text'] === '') {
                        throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' / Reklam #' . ($adIndex + 1) . ' primary text zorunlu.');
                    }
                    if ($ad['ad_headline'] === '') {
                        throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' / Reklam #' . ($adIndex + 1) . ' headline zorunlu.');
                    }
                    if ($ad['media_type'] === 'video') {
                        throw new \RuntimeException('Video create akışı henüz bağlı değil. Şimdilik görsel ile devam et.');
                    }
                    if ($ad['creative_source'] === '') {
                        throw new \RuntimeException('Ad Set #' . ($adSetIndex + 1) . ' / Reklam #' . ($adIndex + 1) . ' için görsel yolu zorunlu.');
                    }
                }
            }

            $metaService = new MetaAdsService();

            $campaignResult = $metaService->createCampaign(
                $connection['access_token'],
                $connection['ad_account_id'],
                $form['campaign_name'],
                $form['objective'],
                $form['campaign_status']
            );

            $createdCampaignId = $campaignResult['id'] ?? '';

            if ($createdCampaignId === '') {
                throw new \RuntimeException('Campaign ID alinamadi.');
            }

            $projectRoot = realpath(__DIR__ . '/..') ?: dirname(__DIR__);

            foreach ($form['adsets'] as $adSet) {
                $targeting = [
                    'geo_locations' => [
                        'countries' => [strtoupper($adSet['country'])],
                    ],
                    'age_min' => (int)$adSet['min_age'],
                    'age_max' => (int)$adSet['max_age'],
                    'publisher_platforms' => ['facebook', 'instagram'],
                    'facebook_positions' => ['feed'],
                    'instagram_positions' => ['stream'],
                ];

                if ($adSet['gender'] === 'male') {
                    $targeting['genders'] = [1];
                } elseif ($adSet['gender'] === 'female') {
                    $targeting['genders'] = [2];
                }

                $adSetPayload = [
                    'name' => $adSet['name'],
                    'campaign_id' => $createdCampaignId,
                    'daily_budget' => $adSet['daily_budget'],
                    'billing_event' => $adSet['billing_event'],
                    'optimization_goal' => $adSet['optimization_goal'],
                    'bid_strategy' => $adSet['bid_strategy'],
                    'status' => $adSet['status'],
                    'is_adset_budget_sharing_enabled' => false,
                    'targeting' => $targeting,
                    'start_time' => $adSet['start_time'],
                    'end_time' => $adSet['end_time'] !== '' ? $adSet['end_time'] : null,
                ];

                if (in_array($form['objective'], ['OUTCOME_LEADS', 'OUTCOME_SALES'], true)) {
                    $adSetPayload['promoted_object'] = [
                        'pixel_id' => $adSet['pixel_id'],
                        'custom_event_type' => $adSet['custom_event_type'],
                    ];

                    $adSetPayload['attribution_spec'] = [
                        [
                            'event_type' => 'CLICK_THROUGH',
                            'window_days' => 7,
                        ],
                    ];
                }

                $adSetResult = $metaService->createAdSet(
                    $connection['access_token'],
                    $connection['ad_account_id'],
                    $adSetPayload
                );

                $createdAdSetId = $adSetResult['id'] ?? '';

                if ($createdAdSetId === '') {
                    throw new \RuntimeException('Ad Set ID alinamadi.');
                }

                $createdAdSetIds[] = $createdAdSetId;

                foreach ($adSet['ads'] as $ad) {
                    $normalizedRelativePath = ltrim(str_replace(['../', '..\\'], '', $ad['creative_source']), '/\\');
                    $absoluteImagePath = $projectRoot . '/public/' . $normalizedRelativePath;

                    if (!is_file($absoluteImagePath)) {
                        throw new \RuntimeException('Gorsel dosyasi bulunamadi: ' . $absoluteImagePath);
                    }

                    $uploadResult = $metaService->uploadAdImage(
                        $connection['access_token'],
                        $connection['ad_account_id'],
                        $absoluteImagePath
                    );

                    $imageHash = '';
                    if (!empty($uploadResult['images']) && is_array($uploadResult['images'])) {
                        foreach ($uploadResult['images'] as $imageItem) {
                            if (!empty($imageItem['hash'])) {
                                $imageHash = (string)$imageItem['hash'];
                                break;
                            }
                        }
                    }

                    if ($imageHash === '') {
                        throw new \RuntimeException('Image hash alinamadi.');
                    }

                    $creativeResult = $metaService->createAdCreative(
                        $connection['access_token'],
                        $connection['ad_account_id'],
                        [
                            'name' => $ad['ad_name'] . ' Creative',
                            'page_id' => $ad['page_id'],
                            'primary_text' => $ad['primary_text'],
                            'destination_url' => $ad['destination_url'],
                            'headline' => $ad['ad_headline'],
                            'description' => $ad['ad_description'],
                            'cta_type' => $ad['cta_type'],
                            'image_hash' => $imageHash,
                        ]
                    );

                    $createdCreativeId = $creativeResult['id'] ?? '';

                    if ($createdCreativeId === '') {
                        throw new \RuntimeException('Creative ID alinamadi.');
                    }

                    $createdCreativeIds[] = $createdCreativeId;

                    $adResult = $metaService->createAd(
                        $connection['access_token'],
                        $connection['ad_account_id'],
                        [
                            'name' => $ad['ad_name'],
                            'adset_id' => $createdAdSetId,
                            'creative_id' => $createdCreativeId,
                            'status' => $ad['ad_status'],
                        ]
                    );

                    $createdAdId = $adResult['id'] ?? '';

                    if ($createdAdId === '') {
                        throw new \RuntimeException('Ad ID alinamadi.');
                    }

                    $createdAdIds[] = $createdAdId;
                }
            }

            $mesaj = 'Kampanya, ad set ve reklamlar başarıyla oluşturuldu.';
        } catch (\Throwable $e) {
            $hata = 'Oluşturma hatası: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Kampanya Akışı Oluştur</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/style.css?v=<?= time() ?>" rel="stylesheet">
    <style>
        .builder-form { display: grid; gap: 24px; }
        .builder-section {
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 22px;
            background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
            padding: 22px;
        }
        .builder-section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
            padding-bottom: 14px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .builder-section-header h5 { margin: 0; color: #fff; font-weight: 800; }
        .builder-section-header p { margin: 6px 0 0; color: #9aa7c7; font-size: 0.92rem; }
        .builder-chip {
            display: inline-flex;
            align-items: center;
            padding: 7px 12px;
            border-radius: 999px;
            background: rgba(109, 93, 252, 0.12);
            color: #dfe7ff;
            font-size: 0.78rem;
            font-weight: 700;
            border: 1px solid rgba(109, 93, 252, 0.18);
            white-space: nowrap;
        }
        .adset-card, .ad-card {
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 18px;
            padding: 18px;
            background: rgba(255,255,255,0.02);
        }
        .adset-card { margin-bottom: 18px; }
        .ad-card { margin-top: 14px; }
        .card-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
        }
        .card-top h6 { margin: 0; color: #fff; font-weight: 700; }
        .hidden-block { display: none; }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-top: 18px;
        }
        .status-box {
            padding: 16px 18px;
            border-radius: 18px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
        }
        .status-box .label {
            color: #9aa7c7;
            font-size: 0.78rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 6px;
        }
        .status-box .value { color: #fff; font-weight: 700; word-break: break-word; }
        @media (max-width: 992px) {
            .status-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 768px) {
            .builder-section-header, .card-top {
                flex-direction: column;
                align-items: flex-start;
            }
            .status-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
<nav class="navbar navbar-dark px-3">
    <span class="navbar-brand">Meta Reklam Paneli</span>
    <div class="text-white d-flex align-items-center gap-3">
        <span><?= htmlspecialchars($user['name']) ?></span>
        <a href="dashboard.php" class="btn btn-sm btn-outline-light">Panele Dön</a>
        <a href="logout.php" class="btn btn-sm btn-outline-light">Çıkış Yap</a>
    </div>
</nav>

<div class="container py-4">
    <div class="page-hero mb-4">
        <h1>Kampanya Akışı Oluştur</h1>
        <p>Tek kampanya altında farklı ad set ve farklı reklam kurguları oluştur.</p>
    </div>

    <?php if ($mesaj): ?>
        <div class="alert alert-success"><?= htmlspecialchars($mesaj) ?></div>
    <?php endif; ?>

    <?php if ($hata): ?>
        <div class="alert alert-danger" style="white-space: pre-wrap;"><?= htmlspecialchars($hata) ?></div>
    <?php endif; ?>

    <?php if ($createdCampaignId !== '' || !empty($createdAdSetIds) || !empty($createdCreativeIds) || !empty($createdAdIds)): ?>
        <div class="status-grid mb-4">
            <div class="status-box">
                <div class="label">Campaign ID</div>
                <div class="value"><?= htmlspecialchars($createdCampaignId !== '' ? $createdCampaignId : '-') ?></div>
            </div>
            <div class="status-box">
                <div class="label">Ad Set Sayısı</div>
                <div class="value"><?= count($createdAdSetIds) ?></div>
            </div>
            <div class="status-box">
                <div class="label">Creative Sayısı</div>
                <div class="value"><?= count($createdCreativeIds) ?></div>
            </div>
            <div class="status-box">
                <div class="label">Ad Sayısı</div>
                <div class="value"><?= count($createdAdIds) ?></div>
            </div>
        </div>
    <?php endif; ?>

    <form method="POST" class="card p-4" id="campaignBuilderForm">
        <div class="builder-form">

            <div class="builder-section">
                <div class="builder-section-header">
                    <div>
                        <h5>1. Kampanya</h5>
                        <p>Ana kampanya ayarları.</p>
                    </div>
                    <span class="builder-chip">Campaign</span>
                </div>

                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Kampanya Adı</label>
                        <input type="text" name="campaign_name" class="form-control" value="<?= htmlspecialchars($form['campaign_name']) ?>" required>
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Objective</label>
                        <select name="objective" id="objective" class="form-select">
                            <option value="OUTCOME_TRAFFIC" <?= $form['objective'] === 'OUTCOME_TRAFFIC' ? 'selected' : '' ?>>Traffic</option>
                            <option value="OUTCOME_LEADS" <?= $form['objective'] === 'OUTCOME_LEADS' ? 'selected' : '' ?>>Leads</option>
                            <option value="OUTCOME_SALES" <?= $form['objective'] === 'OUTCOME_SALES' ? 'selected' : '' ?>>Sales</option>
                        </select>
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Campaign Status</label>
                        <select name="campaign_status" class="form-select">
                            <option value="ACTIVE" <?= $form['campaign_status'] === 'ACTIVE' ? 'selected' : '' ?>>Active</option>
                            <option value="PAUSED" <?= $form['campaign_status'] === 'PAUSED' ? 'selected' : '' ?>>Paused</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="builder-section">
                <div class="builder-section-header">
                    <div>
                        <h5>2. Ad Set ve Reklamlar</h5>
                        <p>Her ad set altında farklı reklamlar oluştur.</p>
                    </div>
                    <button type="button" class="btn btn-primary btn-sm" id="addAdSetBtn">Ad Set Ekle</button>
                </div>

                <div id="adsetsContainer"></div>
            </div>

            <div class="d-flex gap-2 flex-wrap">
                <button type="submit" class="btn btn-primary">Kampanya Akışını Oluştur</button>
                <a href="dashboard.php" class="btn btn-outline-light">Vazgeç</a>
            </div>
        </div>
    </form>
</div>

<script>
(function () {
    const formData = <?= json_encode($form, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;
    const adsetsContainer = document.getElementById('adsetsContainer');
    const addAdSetBtn = document.getElementById('addAdSetBtn');
    const objectiveSelect = document.getElementById('objective');

    function adTemplate(adSetIndex, adIndex, ad) {
        return `
            <div class="ad-card" data-ad-index="${adIndex}">
                <div class="card-top">
                    <h6>Reklam #${adIndex + 1}</h6>
                    <button type="button" class="btn btn-outline-danger btn-sm remove-ad-btn">Reklamı Sil</button>
                </div>

                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Medya Türü</label>
                        <select name="adsets[${adSetIndex}][ads][${adIndex}][media_type]" class="form-select media-type-select">
                            <option value="image" ${ad.media_type === 'image' ? 'selected' : ''}>Görsel</option>
                            <option value="video" ${ad.media_type === 'video' ? 'selected' : ''}>Video</option>
                        </select>
                    </div>

                    <div class="col-md-4">
                        <label class="form-label">Page ID</label>
                        <input type="text" name="adsets[${adSetIndex}][ads][${adIndex}][page_id]" class="form-control" value="${escapeHtml(ad.page_id)}">
                    </div>

                    <div class="col-md-4">
                        <label class="form-label">Reklam Adı</label>
                        <input type="text" name="adsets[${adSetIndex}][ads][${adIndex}][ad_name]" class="form-control" value="${escapeHtml(ad.ad_name)}">
                    </div>

                    <div class="col-md-6 media-image-block">
                        <label class="form-label">Görsel Yolu / AI Kreatif</label>
                        <input type="text" name="adsets[${adSetIndex}][ads][${adIndex}][creative_source]" class="form-control" value="${escapeHtml(ad.creative_source)}">
                    </div>

                    <div class="col-md-6 media-video-block">
                        <label class="form-label">Video Yolu</label>
                        <input type="text" name="adsets[${adSetIndex}][ads][${adIndex}][video_source]" class="form-control" value="${escapeHtml(ad.video_source)}">
                    </div>

                    <div class="col-md-12">
                        <label class="form-label">Destination URL</label>
                        <input type="text" name="adsets[${adSetIndex}][ads][${adIndex}][destination_url]" class="form-control" value="${escapeHtml(ad.destination_url)}">
                    </div>

                    <div class="col-md-12">
                        <label class="form-label">Primary Text</label>
                        <textarea name="adsets[${adSetIndex}][ads][${adIndex}][primary_text]" class="form-control" rows="3">${escapeHtml(ad.primary_text)}</textarea>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Headline</label>
                        <input type="text" name="adsets[${adSetIndex}][ads][${adIndex}][ad_headline]" class="form-control" value="${escapeHtml(ad.ad_headline)}">
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Description</label>
                        <input type="text" name="adsets[${adSetIndex}][ads][${adIndex}][ad_description]" class="form-control" value="${escapeHtml(ad.ad_description)}">
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">CTA</label>
                        <select name="adsets[${adSetIndex}][ads][${adIndex}][cta_type]" class="form-select">
                            <option value="LEARN_MORE" ${ad.cta_type === 'LEARN_MORE' ? 'selected' : ''}>LEARN_MORE</option>
                            <option value="SHOP_NOW" ${ad.cta_type === 'SHOP_NOW' ? 'selected' : ''}>SHOP_NOW</option>
                            <option value="SIGN_UP" ${ad.cta_type === 'SIGN_UP' ? 'selected' : ''}>SIGN_UP</option>
                            <option value="CONTACT_US" ${ad.cta_type === 'CONTACT_US' ? 'selected' : ''}>CONTACT_US</option>
                        </select>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Ad Status</label>
                        <select name="adsets[${adSetIndex}][ads][${adIndex}][ad_status]" class="form-select">
                            <option value="ACTIVE" ${ad.ad_status === 'ACTIVE' ? 'selected' : ''}>Active</option>
                            <option value="PAUSED" ${ad.ad_status === 'PAUSED' ? 'selected' : ''}>Paused</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    function adSetTemplate(adSetIndex, adSet) {
        const adsHtml = (adSet.ads || []).map((ad, adIndex) => adTemplate(adSetIndex, adIndex, ad)).join('');

        return `
            <div class="adset-card" data-adset-index="${adSetIndex}">
                <div class="card-top">
                    <h6>Ad Set #${adSetIndex + 1}</h6>
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-outline-primary btn-sm add-ad-btn">Reklam Ekle</button>
                        <button type="button" class="btn btn-outline-danger btn-sm remove-adset-btn">Ad Seti Sil</button>
                    </div>
                </div>

                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Ad Set Adı</label>
                        <input type="text" name="adsets[${adSetIndex}][name]" class="form-control" value="${escapeHtml(adSet.name)}">
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Günlük Bütçe</label>
                        <input type="text" name="adsets[${adSetIndex}][daily_budget]" class="form-control" value="${escapeHtml(adSet.daily_budget)}">
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Ad Set Status</label>
                        <select name="adsets[${adSetIndex}][status]" class="form-select">
                            <option value="ACTIVE" ${adSet.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
                            <option value="PAUSED" ${adSet.status === 'PAUSED' ? 'selected' : ''}>Paused</option>
                        </select>
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Billing Event</label>
                        <select name="adsets[${adSetIndex}][billing_event]" class="form-select">
                            <option value="IMPRESSIONS" ${adSet.billing_event === 'IMPRESSIONS' ? 'selected' : ''}>IMPRESSIONS</option>
                            <option value="CLICKS" ${adSet.billing_event === 'CLICKS' ? 'selected' : ''}>CLICKS</option>
                        </select>
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Optimization Goal</label>
                        <select name="adsets[${adSetIndex}][optimization_goal]" class="form-select">
                            <option value="LINK_CLICKS" ${adSet.optimization_goal === 'LINK_CLICKS' ? 'selected' : ''}>LINK_CLICKS</option>
                            <option value="LANDING_PAGE_VIEWS" ${adSet.optimization_goal === 'LANDING_PAGE_VIEWS' ? 'selected' : ''}>LANDING_PAGE_VIEWS</option>
                            <option value="LEAD_GENERATION" ${adSet.optimization_goal === 'LEAD_GENERATION' ? 'selected' : ''}>LEAD_GENERATION</option>
                            <option value="OFFSITE_CONVERSIONS" ${adSet.optimization_goal === 'OFFSITE_CONVERSIONS' ? 'selected' : ''}>OFFSITE_CONVERSIONS</option>
                        </select>
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Bid Strategy</label>
                        <select name="adsets[${adSetIndex}][bid_strategy]" class="form-select">
                            <option value="LOWEST_COST_WITHOUT_CAP" ${adSet.bid_strategy === 'LOWEST_COST_WITHOUT_CAP' ? 'selected' : ''}>LOWEST_COST_WITHOUT_CAP</option>
                        </select>
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Ülke</label>
                        <input type="text" name="adsets[${adSetIndex}][country]" class="form-control" value="${escapeHtml(adSet.country)}">
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Min Yaş</label>
                        <input type="number" name="adsets[${adSetIndex}][min_age]" class="form-control" value="${escapeHtml(adSet.min_age)}">
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Max Yaş</label>
                        <input type="number" name="adsets[${adSetIndex}][max_age]" class="form-control" value="${escapeHtml(adSet.max_age)}">
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Cinsiyet</label>
                        <select name="adsets[${adSetIndex}][gender]" class="form-select">
                            <option value="all" ${adSet.gender === 'all' ? 'selected' : ''}>Tümü</option>
                            <option value="male" ${adSet.gender === 'male' ? 'selected' : ''}>Erkek</option>
                            <option value="female" ${adSet.gender === 'female' ? 'selected' : ''}>Kadın</option>
                        </select>
                    </div>

                    <div class="col-md-6 objective-pixel-block">
                        <label class="form-label">Pixel ID</label>
                        <input type="text" name="adsets[${adSetIndex}][pixel_id]" class="form-control" value="${escapeHtml(adSet.pixel_id)}">
                    </div>

                    <div class="col-md-6 objective-pixel-block">
                        <label class="form-label">Custom Event Type</label>
                        <select name="adsets[${adSetIndex}][custom_event_type]" class="form-select">
                            <option value="LEAD" ${adSet.custom_event_type === 'LEAD' ? 'selected' : ''}>LEAD</option>
                            <option value="PURCHASE" ${adSet.custom_event_type === 'PURCHASE' ? 'selected' : ''}>PURCHASE</option>
                            <option value="COMPLETE_REGISTRATION" ${adSet.custom_event_type === 'COMPLETE_REGISTRATION' ? 'selected' : ''}>COMPLETE_REGISTRATION</option>
                        </select>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Başlangıç Zamanı</label>
                        <input type="text" name="adsets[${adSetIndex}][start_time]" class="form-control" value="${escapeHtml(adSet.start_time)}">
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Bitiş Zamanı</label>
                        <input type="text" name="adsets[${adSetIndex}][end_time]" class="form-control" value="${escapeHtml(adSet.end_time)}">
                    </div>
                </div>

                <div class="mt-3 ads-container">
                    ${adsHtml}
                </div>
            </div>
        `;
    }

    function defaultAd() {
        return {
            media_type: 'image',
            creative_source: '',
            video_source: '',
            page_id: '',
            ad_name: '',
            destination_url: '',
            primary_text: '',
            ad_headline: '',
            ad_description: '',
            cta_type: 'LEARN_MORE',
            ad_status: 'ACTIVE'
        };
    }

    function defaultAdSet() {
        return {
            name: '',
            daily_budget: '1000',
            billing_event: 'IMPRESSIONS',
            optimization_goal: 'LINK_CLICKS',
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
            status: 'ACTIVE',
            country: 'TR',
            min_age: '18',
            max_age: '65',
            gender: 'all',
            pixel_id: '',
            custom_event_type: 'LEAD',
            start_time: '<?= htmlspecialchars(date('c', strtotime('+1 hour')), ENT_QUOTES, 'UTF-8') ?>',
            end_time: '',
            ads: [defaultAd()]
        };
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderAdSets() {
        adsetsContainer.innerHTML = '';
        formData.adsets.forEach((adSet, adSetIndex) => {
            adsetsContainer.insertAdjacentHTML('beforeend', adSetTemplate(adSetIndex, adSet));
        });
        bindDynamicActions();
        togglePixelFields();
        toggleMediaFields();
    }

    function bindDynamicActions() {
        document.querySelectorAll('.remove-adset-btn').forEach((btn) => {
            btn.onclick = function () {
                const card = this.closest('.adset-card');
                const index = Number(card.dataset.adsetIndex);
                if (formData.adsets.length <= 1) {
                    return;
                }
                formData.adsets.splice(index, 1);
                renderAdSets();
            };
        });

        document.querySelectorAll('.add-ad-btn').forEach((btn) => {
            btn.onclick = function () {
                const card = this.closest('.adset-card');
                const index = Number(card.dataset.adsetIndex);
                formData.adsets[index].ads.push(defaultAd());
                renderAdSets();
            };
        });

        document.querySelectorAll('.remove-ad-btn').forEach((btn) => {
            btn.onclick = function () {
                const adCard = this.closest('.ad-card');
                const adSetCard = this.closest('.adset-card');
                const adSetIndex = Number(adSetCard.dataset.adsetIndex);
                const adIndex = Number(adCard.dataset.adIndex);

                if (formData.adsets[adSetIndex].ads.length <= 1) {
                    return;
                }

                formData.adsets[adSetIndex].ads.splice(adIndex, 1);
                renderAdSets();
            };
        });

        document.querySelectorAll('.media-type-select').forEach((select) => {
            select.onchange = function () {
                toggleMediaFields();
            };
        });
    }

    function togglePixelFields() {
        const requiresPixel = ['OUTCOME_LEADS', 'OUTCOME_SALES'].includes(objectiveSelect.value);
        document.querySelectorAll('.objective-pixel-block').forEach((block) => {
            block.classList.toggle('hidden-block', !requiresPixel);
        });
    }

    function toggleMediaFields() {
        document.querySelectorAll('.ad-card').forEach((adCard) => {
            const mediaTypeSelect = adCard.querySelector('.media-type-select');
            const imageBlock = adCard.querySelector('.media-image-block');
            const videoBlock = adCard.querySelector('.media-video-block');

            if (!mediaTypeSelect || !imageBlock || !videoBlock) {
                return;
            }

            const isVideo = mediaTypeSelect.value === 'video';
            imageBlock.classList.toggle('hidden-block', isVideo);
            videoBlock.classList.toggle('hidden-block', !isVideo);
        });
    }

    addAdSetBtn.addEventListener('click', function () {
        formData.adsets.push(defaultAdSet());
        renderAdSets();
    });

    objectiveSelect.addEventListener('change', togglePixelFields);

    renderAdSets();
})();
</script>
</body>
</html>