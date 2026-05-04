<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/helpers/auth.php';

requireLogin();

use App\Models\AIAnalysisCache;
use App\Services\OpenAIAnalysisService;
use App\Models\CampaignCache;
use App\Models\MetaConnection;
use App\Services\MetaAdsService;
use App\Services\AIOptimizationService;

$db = require __DIR__ . '/../app/config/database.php';

$user = $_SESSION['user'];

$metaConnectionModel = new MetaConnection($db);
$campaignCacheModel = new CampaignCache($db);
$aiAnalysisCacheModel = new AIAnalysisCache($db);
$connection = $metaConnectionModel->getByUserId((int)$user['id']);

$mesaj = '';
$hata = '';
$campaignData = [];
$showOptimizationConfirm = false;

$datePreset = $_GET['date_preset'] ?? 'last_30d';
$dateFrom = $_GET['date_from'] ?? '';
$dateTo = $_GET['date_to'] ?? '';

$allowedPresets = [
    'today',
    'yesterday',
    'last_7d',
    'last_14d',
    'last_30d',
    'this_month',
    'last_month',
    'custom'
];

if (!in_array($datePreset, $allowedPresets, true)) {
    $datePreset = 'last_30d';
}

$dateFromValue = $datePreset === 'custom' ? $dateFrom : null;
$dateToValue = $datePreset === 'custom' ? $dateTo : null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_meta_connection'])) {
    $accessTokenInput = trim($_POST['access_token'] ?? '');
    $adAccountId = trim($_POST['ad_account_id'] ?? '');

    $currentToken = $connection['access_token'] ?? '';
    $accessToken = $currentToken;

    if ($accessTokenInput !== '' && $accessTokenInput !== '••••••••••••••••••••••••••••••••') {
        $accessToken = $accessTokenInput;
    }

    if ($accessToken === '' || $adAccountId === '') {
        $hata = 'Lütfen access token ve reklam hesabı ID alanlarını doldurun.';
    } else {
        $saved = $metaConnectionModel->save((int)$user['id'], $accessToken, $adAccountId);

        if ($saved) {
            $mesaj = 'Meta bağlantısı başarıyla kaydedildi.';
            $connection = $metaConnectionModel->getByUserId((int)$user['id']);
        } else {
            $hata = 'Meta bağlantısı kaydedilemedi.';
        }
    }
}

if ($connection) {
    try {
        $forceRefresh = isset($_GET['refresh']) && $_GET['refresh'] === '1';

        if (!$forceRefresh) {
            $campaignData = $campaignCacheModel->getByFilter(
                (int)$user['id'],
                $datePreset,
                $dateFromValue,
                $dateToValue
            );
        }

        if ($forceRefresh || empty($campaignData)) {
            $metaService = new MetaAdsService();

            $campaignData = $metaService->fetchInsights(
                $connection['access_token'],
                $connection['ad_account_id'],
                $datePreset,
                $dateFromValue,
                $dateToValue
            );

            $campaignCacheModel->saveMany(
                (int)$user['id'],
                $campaignData,
                $datePreset,
                $dateFromValue,
                $dateToValue
            );
        }
    } catch (\Throwable $e) {
        $hata = 'Meta verisi alınamadı: ' . $e->getMessage();
    }
}

$totalSpend = 0;
$totalImpressions = 0;
$totalClicks = 0;
$totalResults = 0;
$totalRoas = 0;
$avgCtr = 0;
$avgRoas = 0;

if (!empty($campaignData)) {
    foreach ($campaignData as $campaign) {
        $totalSpend += (float)($campaign['spend'] ?? 0);
        $totalImpressions += (int)($campaign['impressions'] ?? 0);
        $totalClicks += (int)($campaign['clicks'] ?? 0);
        $totalResults += (float)($campaign['results_count'] ?? 0);
        $totalRoas += (float)($campaign['roas_value'] ?? 0);
    }

    if ($totalImpressions > 0) {
        $avgCtr = ($totalClicks / $totalImpressions) * 100;
    }

    if (count($campaignData) > 0) {
        $avgRoas = $totalRoas / count($campaignData);
    }
}

$previousSummary = [
    'spend' => 0,
    'impressions' => 0,
    'clicks' => 0,
    'results' => 0,
    'ctr' => 0,
    'roas' => 0,
];

$trends = [];

if ($connection) {
    try {
        $metaService = new MetaAdsService();

        $previousPeriod = $metaService->getPreviousPeriod($datePreset, $dateFromValue, $dateToValue);

        $previousCampaignData = $metaService->fetchInsights(
            $connection['access_token'],
            $connection['ad_account_id'],
            $previousPeriod['date_preset'],
            $previousPeriod['date_from'],
            $previousPeriod['date_to']
        );

        $currentSummary = $metaService->summarizeInsights($campaignData);
        $previousSummary = $metaService->summarizeInsights($previousCampaignData);

        $trends = [
            'spend' => $metaService->calculateTrend((float)$currentSummary['spend'], (float)$previousSummary['spend']),
            'impressions' => $metaService->calculateTrend((float)$currentSummary['impressions'], (float)$previousSummary['impressions']),
            'clicks' => $metaService->calculateTrend((float)$currentSummary['clicks'], (float)$previousSummary['clicks']),
            'results' => $metaService->calculateTrend((float)$currentSummary['results'], (float)$previousSummary['results']),
            'ctr' => $metaService->calculateTrend((float)$currentSummary['ctr'], (float)$previousSummary['ctr']),
            'roas' => $metaService->calculateTrend((float)$currentSummary['roas'], (float)$previousSummary['roas']),
        ];
    } catch (\Throwable $e) {
        $trends = [];
    }
}

$chartLabels = [];
$chartSpendData = [];

if (!empty($campaignData)) {
    foreach ($campaignData as $campaign) {
        $chartLabels[] = $campaign['campaign_name'] ?? 'Adsız Kampanya';
        $chartSpendData[] = (float)($campaign['spend'] ?? 0);
    }
}

$topSpendCampaign = null;
$topRoasCampaign = null;
$worstCtrCampaign = null;
$highestCpcCampaign = null;

if (!empty($campaignData)) {
    $topSpendCampaign = $campaignData[0];
    $topRoasCampaign = $campaignData[0];
    $worstCtrCampaign = $campaignData[0];
    $highestCpcCampaign = $campaignData[0];

    foreach ($campaignData as $campaign) {
        if ((float)($campaign['spend'] ?? 0) > (float)($topSpendCampaign['spend'] ?? 0)) {
            $topSpendCampaign = $campaign;
        }

        if ((float)($campaign['roas_value'] ?? 0) > (float)($topRoasCampaign['roas_value'] ?? 0)) {
            $topRoasCampaign = $campaign;
        }

        if ((float)($campaign['ctr'] ?? 0) < (float)($worstCtrCampaign['ctr'] ?? 0)) {
            $worstCtrCampaign = $campaign;
        }

        if ((float)($campaign['cpc'] ?? 0) > (float)($highestCpcCampaign['cpc'] ?? 0)) {
            $highestCpcCampaign = $campaign;
        }
    }
}

$alerts = [];

if (!empty($campaignData)) {
    foreach ($campaignData as $campaign) {
        $campaignName = $campaign['campaign_name'] ?? '-';
        $ctr = (float)($campaign['ctr'] ?? 0);
        $cpc = (float)($campaign['cpc'] ?? 0);
        $roas = (float)($campaign['roas_value'] ?? 0);
        $results = (float)($campaign['results_count'] ?? 0);
        $spend = (float)($campaign['spend'] ?? 0);

        if ($ctr > 0 && $ctr < 1) {
            $alerts[] = $campaignName . ' kampanyasında CTR düşük: %' . number_format($ctr, 2, ',', '.');
        }

        if ($cpc > 20) {
            $alerts[] = $campaignName . ' kampanyasında CPC yüksek: ' . number_format($cpc, 2, ',', '.') . ' ₺';
        }

        if ($spend > 0 && $results == 0) {
            $alerts[] = $campaignName . ' kampanyası harcama yapmış ama sonuç üretmemiş.';
        }

        if ($roas > 0 && $roas < 1.5) {
            $alerts[] = $campaignName . ' kampanyasında ROAS düşük: ' . number_format($roas, 2, ',', '.');
        }
    }
}

$riskItems = [];

if ($topRoasCampaign) {
    $riskItems[] = 'En güçlü kampanya: ' . ($topRoasCampaign['campaign_name'] ?? '-') . ' — ROAS: ' . number_format((float)($topRoasCampaign['roas_value'] ?? 0), 2, ',', '.');
}

if ($worstCtrCampaign && (float)($worstCtrCampaign['ctr'] ?? 0) < 1) {
    $riskItems[] = 'Düşük ilgi problemi var: ' . ($worstCtrCampaign['campaign_name'] ?? '-') . ' kampanyasında CTR %' . number_format((float)($worstCtrCampaign['ctr'] ?? 0), 2, ',', '.') . '.';
}

if ($highestCpcCampaign && (float)($highestCpcCampaign['cpc'] ?? 0) > 20) {
    $riskItems[] = 'Tıklama maliyeti yüksek: ' . ($highestCpcCampaign['campaign_name'] ?? '-') . ' kampanyasında CPC ' . number_format((float)($highestCpcCampaign['cpc'] ?? 0), 2, ',', '.') . ' ₺.';
}

if ($avgRoas > 0 && $avgRoas < 1.5) {
    $riskItems[] = 'Genel ROAS zayıf. Bütçe dağılımını yeniden gözden geçirmek gerekiyor.';
} elseif ($avgRoas >= 1.5 && $avgRoas < 3) {
    $riskItems[] = 'Genel performans orta seviyede. Düşük CTR ve yüksek CPC alanları optimize edilmeli.';
} elseif ($avgRoas >= 3) {
    $riskItems[] = 'Genel performans güçlü görünüyor. Yüksek ROAS kampanyalarda ölçekleme düşünülebilir.';
}

$cachedAiAnalysisRow = $aiAnalysisCacheModel->getByFilter(
    (int)$user['id'],
    $datePreset,
    $dateFromValue,
    $dateToValue
);

$aiAnalysis = $cachedAiAnalysisRow['analysis_text'] ?? '';

$optimizationService = new AIOptimizationService();
$optimizationActions = $optimizationService->buildCampaignActions($campaignData);
$optimizationSummary = $optimizationService->summarizeActions($optimizationActions);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['generate_ai_analysis'])) {
    try {
        $analysisService = new OpenAIAnalysisService();

        $aiAnalysis = $analysisService->generateDashboardAnalysis($campaignData, [
            'total_spend' => $totalSpend,
            'total_impressions' => $totalImpressions,
            'total_clicks' => $totalClicks,
            'total_results' => $totalResults,
            'avg_ctr' => $avgCtr,
            'avg_roas' => $avgRoas,
        ]);

        if (
            $aiAnalysis !== '' &&
            !str_starts_with($aiAnalysis, 'OpenAI API hatası:') &&
            !str_starts_with($aiAnalysis, 'OpenAI bağlantı hatası:') &&
            !str_starts_with($aiAnalysis, 'OpenAI API anahtarı bulunamadı.')
        ) {
            $aiAnalysisCacheModel->save(
                (int)$user['id'],
                $datePreset,
                $dateFromValue,
                $dateToValue,
                $aiAnalysis
            );
        }
    } catch (\Throwable $e) {
        $aiAnalysis = 'AI analizi üretilemedi: ' . $e->getMessage();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['preview_ai_optimizations'])) {
    $showOptimizationConfirm = true;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm_ai_optimizations'])) {
    try {
        if (!$connection) {
            throw new \RuntimeException('Meta bağlantısı bulunamadı.');
        }

        $metaService = new MetaAdsService();
        $appliedCount = 0;

        foreach ($optimizationActions as $action) {
            $type = $action['type'] ?? '';
            $entityId = (string)($action['entity_id'] ?? '');

            if ($entityId === '') {
                continue;
            }

            if ($type === 'pause_campaign') {
                $metaService->updateCampaignStatus(
                    $connection['access_token'],
                    $entityId,
                    'PAUSED'
                );
                $appliedCount++;
            }
        }

        $mesaj = 'AI optimizasyonları onay sonrası uygulandı. Toplam işlem: ' . $appliedCount;
    } catch (\Throwable $e) {
        $hata = 'AI optimizasyon uygulama hatası: ' . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Kontrol Paneli</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/style.css?v=<?= time() ?>" rel="stylesheet">
    <style>
        .dashboard-shell {
            display: grid;
            gap: 24px;
        }

        .dashboard-top {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.75fr);
            gap: 24px;
            align-items: start;
        }

        .metric-grid {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 14px;
        }

        .insight-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
        }

        .hero-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .dashboard-section {
            display: grid;
            gap: 24px;
        }

        .dashboard-chart-card {
            overflow: hidden;
        }

        .chart-shell {
            height: 420px;
            padding: 18px;
            border-radius: 24px;
            background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
            border: 1px solid rgba(255,255,255,0.05);
        }

        .chart-shell canvas {
            height: 100% !important;
        }

        .accordion-dark .accordion-item {
            background: rgba(18, 26, 47, 0.92);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 24px !important;
            overflow: hidden;
            margin-bottom: 16px;
        }

        .accordion-dark .accordion-button {
            background: rgba(18, 26, 47, 0.92);
            color: #fff;
            font-weight: 700;
            box-shadow: none !important;
            padding: 18px 22px;
        }

        .accordion-dark .accordion-button:not(.collapsed) {
            background: linear-gradient(135deg, rgba(109,93,252,0.16), rgba(0,194,255,0.08));
            color: #fff;
        }

        .accordion-dark .accordion-button::after {
            filter: brightness(0) invert(1);
        }

        .accordion-dark .accordion-body {
            background: rgba(18, 26, 47, 0.96);
            color: #eef3ff;
            padding: 22px;
        }

        .action-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .trend-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 12px;
            padding: 7px 11px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
        }

        .trend-up {
            background: rgba(24, 195, 126, 0.14);
            color: #bff3da;
            border: 1px solid rgba(24, 195, 126, 0.22);
        }

        .trend-down {
            background: rgba(255, 93, 122, 0.14);
            color: #ffd1da;
            border: 1px solid rgba(255, 93, 122, 0.22);
        }

        .trend-flat {
            background: rgba(255,255,255,0.08);
            color: #dfe7ff;
            border: 1px solid rgba(255,255,255,0.12);
        }

        .panel-note {
            padding: 16px 18px;
            border-radius: 18px;
            background: rgba(255,255,255,0.035);
            border: 1px solid rgba(255,255,255,0.06);
        }

        .quick-highlight {
            min-height: 100%;
        }

        .ai-loading-overlay {
            position: fixed;
            inset: 0;
            background: rgba(5, 10, 20, 0.72);
            backdrop-filter: blur(8px);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            padding: 20px;
            display: none;
        }

        .ai-loading-overlay.d-none {
            display: none !important;
        }

        .ai-loading-modal {
            width: 100%;
            max-width: 420px;
            background: rgba(18, 26, 47, 0.96);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 28px;
            box-shadow: 0 24px 60px rgba(0,0,0,0.38);
            padding: 32px 24px;
            text-align: center;
            color: #fff;
        }

        .ai-progress-wrap {
            position: relative;
            width: 150px;
            height: 150px;
            margin: 0 auto;
        }

        .ai-progress-ring {
            transform: rotate(-90deg);
        }

        .ai-progress-ring-bg {
            fill: none;
            stroke: rgba(255,255,255,0.08);
            stroke-width: 10;
        }

        .ai-progress-ring-fill {
            fill: none;
            stroke: #6d5dfc;
            stroke-width: 10;
            stroke-linecap: round;
            stroke-dasharray: 389.56;
            stroke-dashoffset: 389.56;
            transition: stroke-dashoffset 0.12s linear;
        }

        .ai-progress-text {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 800;
            color: #fff;
        }

        @media (max-width: 1280px) {
            .metric-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            .insight-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (max-width: 992px) {
            .dashboard-top {
                grid-template-columns: 1fr;
            }

            .chart-shell {
                height: 360px;
            }
        }

        @media (max-width: 768px) {
            .metric-grid,
            .insight-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (max-width: 576px) {
            .metric-grid,
            .insight-grid {
                grid-template-columns: 1fr;
            }

            .chart-shell {
                height: 300px;
                padding: 12px;
            }
        }
    </style>
</head>
<body>
<nav class="navbar navbar-dark px-3">
    <span class="navbar-brand">Meta Reklam Paneli</span>
    <div class="text-white d-flex align-items-center gap-3">
        <span><?= htmlspecialchars($user['name']) ?></span>
        <a href="logout.php" class="btn btn-sm btn-outline-light">Çıkış Yap</a>
    </div>
</nav>

<div class="container py-4">
    <div class="dashboard-shell">
        <div class="page-hero premium-panel">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
                <div>
                    <h1>Kontrol Paneli</h1>
                    <p>Meta reklam performansını premium görünüm, AI analiz ve daha güçlü optimizasyon akışıyla yönet.</p>
                </div>

                <div class="hero-actions">
                    <span class="metric-chip">AI Destekli Analiz</span>
                    <span class="metric-chip">Premium Raporlama</span>
                    <span class="metric-chip">Trend Takibi</span>
                </div>
            </div>
        </div>

        <?php if ($mesaj): ?>
            <div class="alert alert-success"><?= htmlspecialchars($mesaj) ?></div>
        <?php endif; ?>

        <?php if ($hata): ?>
            <div class="alert alert-danger"><?= htmlspecialchars($hata) ?></div>
        <?php endif; ?>

        <div class="dashboard-top">
            <div class="card premium-panel">
                <div class="card-body">
                    <div class="section-title">
                        <h5>Filtre ve Aksiyonlar</h5>
                        <span class="metric-chip">Hızlı İşlemler</span>
                    </div>

                    <form method="GET" class="row g-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label">Tarih Filtresi</label>
                            <select name="date_preset" id="date_preset" class="form-select">
                                <option value="today" <?= $datePreset === 'today' ? 'selected' : '' ?>>Bugün</option>
                                <option value="yesterday" <?= $datePreset === 'yesterday' ? 'selected' : '' ?>>Dün</option>
                                <option value="last_7d" <?= $datePreset === 'last_7d' ? 'selected' : '' ?>>Son 7 Gün</option>
                                <option value="last_14d" <?= $datePreset === 'last_14d' ? 'selected' : '' ?>>Son 14 Gün</option>
                                <option value="last_30d" <?= $datePreset === 'last_30d' ? 'selected' : '' ?>>Son 30 Gün</option>
                                <option value="this_month" <?= $datePreset === 'this_month' ? 'selected' : '' ?>>Bu Ay</option>
                                <option value="last_month" <?= $datePreset === 'last_month' ? 'selected' : '' ?>>Geçen Ay</option>
                                <option value="custom" <?= $datePreset === 'custom' ? 'selected' : '' ?>>Özel Aralık</option>
                            </select>
                        </div>

                        <div class="col-md-3" id="date_from_wrapper" style="<?= $datePreset === 'custom' ? '' : 'display:none;' ?>">
                            <label class="form-label">Başlangıç Tarihi</label>
                            <input type="date" name="date_from" class="form-control" value="<?= htmlspecialchars($dateFrom) ?>">
                        </div>

                        <div class="col-md-3" id="date_to_wrapper" style="<?= $datePreset === 'custom' ? '' : 'display:none;' ?>">
                            <label class="form-label">Bitiş Tarihi</label>
                            <input type="date" name="date_to" class="form-control" value="<?= htmlspecialchars($dateTo) ?>">
                        </div>

                        <div class="col-md-12 col-lg-2">
                            <button type="submit" class="btn btn-dark w-100">Uygula</button>
                        </div>
                    </form>

                    <div class="action-bar mt-4">
                        <a href="dashboard.php?date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>&refresh=1" class="btn btn-outline-primary">Meta'dan Yeniden Çek</a>
                        <a href="export-excel.php?date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>" class="btn btn-success">Excel'e Aktar</a>
                        <a href="report-pdf.php?date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>" class="btn btn-danger" target="_blank">PDF Raporu</a>
                        <a href="create-campaign.php" class="btn btn-primary">Yeni Kampanya Oluştur</a>
                        <a href="creative-generator.php" class="btn btn-primary">AI Kreatif Oluştur</a>
                        <a href="ai-chat.php?date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>" class="btn btn-primary">AI Chat</a>
                        <a href="optimize-ads.php?date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>" class="btn btn-warning">AI Optimizasyon Merkezi</a>
                    </div>
                </div>
            </div>

            <div class="accordion accordion-dark" id="settingsAccordion">
                <div class="accordion-item premium-panel">
                    <h2 class="accordion-header" id="headingSettings">
                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSettings">
                            Meta Bağlantı Ayarları
                        </button>
                    </h2>
                    <div id="collapseSettings" class="accordion-collapse collapse show" data-bs-parent="#settingsAccordion">
                        <div class="accordion-body">
                            <form method="POST">
                                <input type="hidden" name="save_meta_connection" value="1">

                                <div class="mb-3">
                                    <label class="form-label">Access Token</label>
                                    <textarea
                                        name="access_token"
                                        class="form-control"
                                        rows="4"
                                        placeholder="Yeni token girmek istersen buraya yapıştır"
                                    ><?= isset($connection['access_token']) ? '••••••••••••••••••••••••••••••••' : '' ?></textarea>
                                    <small class="text-muted">
                                        Mevcut token güvenlik için gizlenmiştir. Yeni token ile değiştirmek istersen buraya yapıştırıp kaydet.
                                    </small>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Reklam Hesabı ID</label>
                                    <input
                                        type="text"
                                        name="ad_account_id"
                                        class="form-control"
                                        placeholder="act_123456789 veya 123456789"
                                        value="<?= htmlspecialchars($connection['ad_account_id'] ?? '') ?>"
                                        required
                                    >
                                </div>

                                <button type="submit" class="btn btn-primary">Bağlantıyı Kaydet</button>
                            </form>
                        </div>
                    </div>
                </div>

                <div class="card premium-panel quick-highlight mt-3">
                    <div class="card-body">
                        <div class="section-title">
                            <h5>Hızlı Bakış</h5>
                            <span class="metric-chip">Canlı Özet</span>
                        </div>

                        <div class="panel-note">
                            <div class="mb-3">
                                <div class="text-muted mb-1">Toplam Kampanya</div>
                                <strong><?= count($campaignData) ?></strong>
                            </div>
                            <div class="mb-3">
                                <div class="text-muted mb-1">En Güçlü Kampanya</div>
                                <strong><?= htmlspecialchars($topRoasCampaign['campaign_name'] ?? 'Veri yok') ?></strong>
                            </div>
                            <div>
                                <div class="text-muted mb-1">En Riskli Alan</div>
                                <strong><?= htmlspecialchars($highestCpcCampaign['campaign_name'] ?? 'Veri yok') ?></strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="metric-grid">
            <div class="card stat-card premium-panel">
                <div class="card-body">
                    <h6>Harcama</h6>
                    <h3><?= number_format($totalSpend, 2, ',', '.') ?> ₺</h3>
                    <?php if (isset($trends['spend'])): ?>
                        <div class="trend-badge trend-<?= htmlspecialchars($trends['spend']['direction']) ?>">
                            <?= $trends['spend']['direction'] === 'up' ? '▲' : ($trends['spend']['direction'] === 'down' ? '▼' : '•') ?>
                            <?= number_format(abs((float)$trends['spend']['percent']), 1, ',', '.') ?>%
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <div class="card stat-card premium-panel">
                <div class="card-body">
                    <h6>Gösterim</h6>
                    <h3><?= number_format($totalImpressions, 0, ',', '.') ?></h3>
                    <?php if (isset($trends['impressions'])): ?>
                        <div class="trend-badge trend-<?= htmlspecialchars($trends['impressions']['direction']) ?>">
                            <?= $trends['impressions']['direction'] === 'up' ? '▲' : ($trends['impressions']['direction'] === 'down' ? '▼' : '•') ?>
                            <?= number_format(abs((float)$trends['impressions']['percent']), 1, ',', '.') ?>%
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <div class="card stat-card premium-panel">
                <div class="card-body">
                    <h6>Tıklama</h6>
                    <h3><?= number_format($totalClicks, 0, ',', '.') ?></h3>
                    <?php if (isset($trends['clicks'])): ?>
                        <div class="trend-badge trend-<?= htmlspecialchars($trends['clicks']['direction']) ?>">
                            <?= $trends['clicks']['direction'] === 'up' ? '▲' : ($trends['clicks']['direction'] === 'down' ? '▼' : '•') ?>
                            <?= number_format(abs((float)$trends['clicks']['percent']), 1, ',', '.') ?>%
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <div class="card stat-card premium-panel">
                <div class="card-body">
                    <h6>CTR</h6>
                    <h3><?= number_format($avgCtr, 2, ',', '.') ?>%</h3>
                    <?php if (isset($trends['ctr'])): ?>
                        <div class="trend-badge trend-<?= htmlspecialchars($trends['ctr']['direction']) ?>">
                            <?= $trends['ctr']['direction'] === 'up' ? '▲' : ($trends['ctr']['direction'] === 'down' ? '▼' : '•') ?>
                            <?= number_format(abs((float)$trends['ctr']['percent']), 1, ',', '.') ?>%
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <div class="card stat-card premium-panel">
                <div class="card-body">
                    <h6>Sonuç</h6>
                    <h3><?= number_format($totalResults, 0, ',', '.') ?></h3>
                    <?php if (isset($trends['results'])): ?>
                        <div class="trend-badge trend-<?= htmlspecialchars($trends['results']['direction']) ?>">
                            <?= $trends['results']['direction'] === 'up' ? '▲' : ($trends['results']['direction'] === 'down' ? '▼' : '•') ?>
                            <?= number_format(abs((float)$trends['results']['percent']), 1, ',', '.') ?>%
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <div class="card stat-card premium-panel">
                <div class="card-body">
                    <h6>Ortalama ROAS</h6>
                    <h3><?= number_format($avgRoas, 2, ',', '.') ?></h3>
                    <?php if (isset($trends['roas'])): ?>
                        <div class="trend-badge trend-<?= htmlspecialchars($trends['roas']['direction']) ?>">
                            <?= $trends['roas']['direction'] === 'up' ? '▲' : ($trends['roas']['direction'] === 'down' ? '▼' : '•') ?>
                            <?= number_format(abs((float)$trends['roas']['percent']), 1, ',', '.') ?>%
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <div class="dashboard-section">
            <div class="card dashboard-chart-card premium-panel">
                <div class="card-body">
                    <div class="section-title">
                        <h5>Performans Grafiği</h5>
                        <span class="metric-chip">Kampanya Harcama Dağılımı</span>
                    </div>
                    <div class="chart-shell">
                        <canvas id="performanceChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="insight-grid">
                <div class="card stat-card premium-panel h-100">
                    <div class="card-body">
                        <h6>En Çok Harcama</h6>
                        <?php if ($topSpendCampaign): ?>
                            <div class="fw-semibold mb-2"><?= htmlspecialchars($topSpendCampaign['campaign_name'] ?? '-') ?></div>
                            <p><?= number_format((float)($topSpendCampaign['spend'] ?? 0), 2, ',', '.') ?> ₺</p>
                        <?php else: ?>
                            <p>Veri yok</p>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="card stat-card premium-panel h-100">
                    <div class="card-body">
                        <h6>En Yüksek ROAS</h6>
                        <?php if ($topRoasCampaign): ?>
                            <div class="fw-semibold mb-2"><?= htmlspecialchars($topRoasCampaign['campaign_name'] ?? '-') ?></div>
                            <p><?= number_format((float)($topRoasCampaign['roas_value'] ?? 0), 2, ',', '.') ?></p>
                        <?php else: ?>
                            <p>Veri yok</p>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="card stat-card premium-panel h-100">
                    <div class="card-body">
                        <h6>En Düşük CTR</h6>
                        <?php if ($worstCtrCampaign): ?>
                            <div class="fw-semibold mb-2"><?= htmlspecialchars($worstCtrCampaign['campaign_name'] ?? '-') ?></div>
                            <p><?= number_format((float)($worstCtrCampaign['ctr'] ?? 0), 2, ',', '.') ?>%</p>
                        <?php else: ?>
                            <p>Veri yok</p>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="card stat-card premium-panel h-100">
                    <div class="card-body">
                        <h6>En Yüksek CPC</h6>
                        <?php if ($highestCpcCampaign): ?>
                            <div class="fw-semibold mb-2"><?= htmlspecialchars($highestCpcCampaign['campaign_name'] ?? '-') ?></div>
                            <p><?= number_format((float)($highestCpcCampaign['cpc'] ?? 0), 2, ',', '.') ?></p>
                        <?php else: ?>
                            <p>Veri yok</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <div class="accordion accordion-dark" id="dashboardAccordion">
                <div class="accordion-item premium-panel">
                    <h2 class="accordion-header" id="headingAi">
                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAi">
                            AI Analiz
                        </button>
                    </h2>
                    <div id="collapseAi" class="accordion-collapse collapse show" data-bs-parent="#dashboardAccordion">
                        <div class="accordion-body">
                            <div class="d-flex justify-content-end gap-2 flex-wrap mb-3">
                                <form method="POST" class="mb-0" id="aiAnalysisForm">
                                    <input type="hidden" name="generate_ai_analysis" value="1">
                                    <button type="submit" class="btn btn-primary" id="aiAnalysisButton">AI Analizi Yenile</button>
                                </form>

                                <form method="POST" class="mb-0">
                                    <input type="hidden" name="preview_ai_optimizations" value="1">
                                    <button type="submit" class="btn btn-warning">AI ile Optimize Et</button>
                                </form>
                            </div>

                            <?php if ($aiAnalysis !== ''): ?>
                                <div class="border rounded p-3 bg-light" style="white-space: pre-wrap;"><?= htmlspecialchars($aiAnalysis) ?></div>
                            <?php else: ?>
                                <div class="text-muted">Güncel filtreye göre yorum almak için “AI Analizi Yenile” butonuna bas.</div>
                            <?php endif; ?>

                            <div class="mt-4">
                                <h6 class="mb-3">AI Optimizasyon Önizleme</h6>

                                <div class="row g-3 mb-3">
                                    <div class="col-md-4">
                                        <div class="card stat-card premium-panel h-100">
                                            <div class="card-body">
                                                <h6>Durdurulacak Kampanyalar</h6>
                                                <h3><?= (int)($optimizationSummary['pause_campaign'] ?? 0) ?></h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-md-4">
                                        <div class="card stat-card premium-panel h-100">
                                            <div class="card-body">
                                                <h6>Ölçekleme Adayları</h6>
                                                <h3><?= (int)($optimizationSummary['scale_campaign_note'] ?? 0) ?></h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-md-4">
                                        <div class="card stat-card premium-panel h-100">
                                            <div class="card-body">
                                                <h6>İncelenecek Kampanyalar</h6>
                                                <h3><?= (int)($optimizationSummary['review_campaign'] ?? 0) ?></h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <?php if (!empty($optimizationActions)): ?>
                                    <div class="border rounded p-3 bg-light">
                                        <?php foreach ($optimizationActions as $action): ?>
                                            <div class="mb-3">
                                                <strong><?= htmlspecialchars($action['entity_name'] ?? '-') ?></strong><br>
                                                <span><?= htmlspecialchars($action['impact'] ?? '-') ?></span><br>
                                                <small><?= htmlspecialchars($action['reason'] ?? '-') ?></small>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                <?php else: ?>
                                    <div class="text-muted">Şu an otomatik aksiyon gerektiren belirgin bir kampanya görünmüyor.</div>
                                <?php endif; ?>

                                <?php if ($showOptimizationConfirm && !empty($optimizationActions)): ?>
                                    <div class="alert alert-warning mt-3">
                                        <strong>Dikkat:</strong> Bu işlem önerilen aksiyonları gerçekten uygular.
                                        Devam edersen seçilen kampanyalar durdurulabilir.
                                    </div>

                                    <form method="POST" class="d-flex gap-2 flex-wrap mt-2">
                                        <input type="hidden" name="confirm_ai_optimizations" value="1">
                                        <button type="submit" class="btn btn-danger">Evet, Uygula</button>
                                    </form>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="accordion-item premium-panel">
                    <h2 class="accordion-header" id="headingRisks">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseRisks">
                            Riskler ve Aksiyonlar
                        </button>
                    </h2>
                    <div id="collapseRisks" class="accordion-collapse collapse" data-bs-parent="#dashboardAccordion">
                        <div class="accordion-body">
                            <?php if (!empty($riskItems)): ?>
                                <ul class="mb-3">
                                    <?php foreach ($riskItems as $item): ?>
                                        <li class="mb-2"><?= htmlspecialchars($item) ?></li>
                                    <?php endforeach; ?>
                                </ul>
                            <?php endif; ?>

                            <?php if (!empty($alerts)): ?>
                                <?php foreach ($alerts as $alert): ?>
                                    <div class="alert alert-warning mb-2"><?= htmlspecialchars($alert) ?></div>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <div class="alert alert-success mb-0">Şu an dikkat çeken kritik bir performans uyarısı yok.</div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <div class="accordion-item premium-panel">
                    <h2 class="accordion-header" id="headingTable">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTable">
                            Kampanya Verileri
                        </button>
                    </h2>
                    <div id="collapseTable" class="accordion-collapse collapse" data-bs-parent="#dashboardAccordion">
                        <div class="accordion-body">
                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                <span class="metric-chip"><?= count($campaignData) ?> kampanya</span>
                            </div>

                            <div class="table-responsive">
                                <table class="table table-striped align-middle">
                                    <thead>
                                        <tr>
                                            <th>Kampanya</th>
                                            <th>Harcama</th>
                                            <th>Gösterim</th>
                                            <th>Tıklama</th>
                                            <th>CTR</th>
                                            <th>CPC</th>
                                            <th>CPM</th>
                                            <th>Sonuç</th>
                                            <th>ROAS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php if (!empty($campaignData)): ?>
                                            <?php foreach ($campaignData as $campaign): ?>
                                                <tr>
                                                    <td>
                                                        <a
                                                            href="campaign-detail.php?campaign_id=<?= urlencode($campaign['campaign_id'] ?? '') ?>&date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>"
                                                            class="text-decoration-none fw-semibold"
                                                        >
                                                            <?= htmlspecialchars($campaign['campaign_name'] ?? '-') ?>
                                                        </a>
                                                    </td>
                                                    <td><?= number_format((float)($campaign['spend'] ?? 0), 2, ',', '.') ?> ₺</td>
                                                    <td><?= number_format((int)($campaign['impressions'] ?? 0), 0, ',', '.') ?></td>
                                                    <td><?= number_format((int)($campaign['clicks'] ?? 0), 0, ',', '.') ?></td>
                                                    <td><?= number_format((float)($campaign['ctr'] ?? 0), 2, ',', '.') ?>%</td>
                                                    <td><?= number_format((float)($campaign['cpc'] ?? 0), 2, ',', '.') ?></td>
                                                    <td><?= number_format((float)($campaign['cpm'] ?? 0), 2, ',', '.') ?></td>
                                                    <td><?= number_format((float)($campaign['results_count'] ?? 0), 0, ',', '.') ?></td>
                                                    <td><?= number_format((float)($campaign['roas_value'] ?? 0), 2, ',', '.') ?></td>
                                                </tr>
                                            <?php endforeach; ?>
                                        <?php else: ?>
                                            <tr>
                                                <td colspan="9" class="text-center">Henüz veri yok</td>
                                            </tr>
                                        <?php endif; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="aiLoadingOverlay" class="ai-loading-overlay d-none">
    <div class="ai-loading-modal">
        <div class="ai-progress-wrap">
            <svg class="ai-progress-ring" width="150" height="150">
                <circle class="ai-progress-ring-bg" cx="75" cy="75" r="62"></circle>
                <circle class="ai-progress-ring-fill" cx="75" cy="75" r="62"></circle>
            </svg>
            <div class="ai-progress-text" id="aiProgressText">0%</div>
        </div>

        <h4 class="mt-4 mb-2">AI analiz hazırlanıyor</h4>
        <p class="mb-0 text-muted">Lütfen bekleyin, reklam verileri yorumlanıyor...</p>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
window.metaChartData = {
    labels: <?= json_encode($chartLabels, JSON_UNESCAPED_UNICODE) ?>,
    spendData: <?= json_encode($chartSpendData, JSON_UNESCAPED_UNICODE) ?>
};
</script>
<script src="assets/js/dashboard.js"></script>
<script>
const datePreset = document.getElementById('date_preset');
const dateFromWrapper = document.getElementById('date_from_wrapper');
const dateToWrapper = document.getElementById('date_to_wrapper');

function toggleCustomDateFields() {
    const isCustom = datePreset.value === 'custom';
    dateFromWrapper.style.display = isCustom ? 'block' : 'none';
    dateToWrapper.style.display = isCustom ? 'block' : 'none';
}

if (datePreset) {
    datePreset.addEventListener('change', toggleCustomDateFields);
    toggleCustomDateFields();
}
</script>

<script>
(function () {
    const form = document.getElementById('aiAnalysisForm');
    const overlay = document.getElementById('aiLoadingOverlay');
    const progressText = document.getElementById('aiProgressText');
    const progressCircle = document.querySelector('.ai-progress-ring-fill');

    if (!form || !overlay || !progressText || !progressCircle) {
        return;
    }

    const radius = 62;
    const circumference = 2 * Math.PI * radius;

    progressCircle.style.strokeDasharray = String(circumference);
    progressCircle.style.strokeDashoffset = String(circumference);

    let progress = 0;
    let timer = null;
    let submitted = false;

    function setProgress(value) {
        const bounded = Math.max(0, Math.min(100, value));
        const offset = circumference - (bounded / 100) * circumference;
        progressCircle.style.strokeDashoffset = String(offset);
        progressText.textContent = Math.floor(bounded) + '%';
    }

    function startFakeLoading() {
        overlay.classList.remove('d-none');
        overlay.style.display = 'flex';

        progress = 8;
        setProgress(progress);

        timer = setInterval(() => {
            if (progress < 30) {
                progress += Math.random() * 10;
            } else if (progress < 65) {
                progress += Math.random() * 6;
            } else if (progress < 88) {
                progress += Math.random() * 2.5;
            } else if (progress < 95) {
                progress += Math.random() * 0.8;
            }

            if (progress > 95) {
                progress = 95;
            }

            setProgress(progress);
        }, 140);
    }

    form.addEventListener('submit', function (e) {
        if (submitted) {
            return;
        }

        e.preventDefault();
        submitted = true;
        startFakeLoading();

        setTimeout(() => {
            form.submit();
        }, 180);
    });

    window.addEventListener('beforeunload', function () {
        setProgress(100);
        if (timer) {
            clearInterval(timer);
        }
    });
})();
</script>
</body>
</html>