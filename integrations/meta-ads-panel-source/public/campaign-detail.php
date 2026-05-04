<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/helpers/auth.php';

requireLogin();

use App\Models\MetaConnection;
use App\Models\AIDetailAnalysisCache;
use App\Services\MetaAdsService;
use App\Services\OpenAIAnalysisService;

$db = require __DIR__ . '/../app/config/database.php';

$user = $_SESSION['user'];
$campaignId = trim($_GET['campaign_id'] ?? '');
$datePreset = $_GET['date_preset'] ?? 'last_30d';
$dateFrom = $_GET['date_from'] ?? '';
$dateTo = $_GET['date_to'] ?? '';

$dateFromValue = $datePreset === 'custom' ? $dateFrom : null;
$dateToValue = $datePreset === 'custom' ? $dateTo : null;

$metaConnectionModel = new MetaConnection($db);
$aiDetailCacheModel = new AIDetailAnalysisCache($db);
$connection = $metaConnectionModel->getByUserId((int)$user['id']);

$hata = '';
$campaign = null;
$adSets = [];

$cachedAiRow = $aiDetailCacheModel->getByFilter(
    (int)$user['id'],
    'campaign',
    $campaignId,
    $datePreset,
    $dateFromValue,
    $dateToValue
);

$aiAnalysis = $cachedAiRow['analysis_text'] ?? '';

if ($campaignId === '') {
    $hata = 'Kampanya ID bulunamadı.';
} elseif (!$connection) {
    $hata = 'Meta bağlantısı bulunamadı.';
} else {
    try {
        $metaService = new MetaAdsService();

        $campaign = $metaService->fetchCampaignDetail(
            $connection['access_token'],
            $campaignId,
            $datePreset,
            $dateFromValue,
            $dateToValue
        );

        $adSets = $metaService->fetchAdSetsByCampaign(
            $connection['access_token'],
            $campaignId,
            $datePreset,
            $dateFromValue,
            $dateToValue
        );

        if (!$campaign) {
            $hata = 'Kampanya detayı alınamadı.';
        }
    } catch (\Throwable $e) {
        $hata = 'Kampanya detayı alınamadı: ' . $e->getMessage();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['generate_campaign_ai']) && $campaign) {
    try {
        $analysisService = new OpenAIAnalysisService();
        $aiAnalysis = $analysisService->generateCampaignAnalysis($campaign, $adSets);

        if (
            $aiAnalysis !== '' &&
            !str_starts_with($aiAnalysis, 'OpenAI API hatası:') &&
            !str_starts_with($aiAnalysis, 'OpenAI bağlantı hatası:') &&
            !str_starts_with($aiAnalysis, 'OpenAI API anahtarı bulunamadı.')
        ) {
            $aiDetailCacheModel->save(
                (int)$user['id'],
                'campaign',
                $campaignId,
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
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Kampanya Detayı</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/style.css?v=<?= time() ?>" rel="stylesheet">
    <style>
        .detail-top-grid {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 24px;
            margin-bottom: 24px;
        }

        .metric-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 24px;
        }

        .analysis-layout {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
            margin-bottom: 24px;
        }

        .summary-box {
            padding: 16px 18px;
            border-radius: 18px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
        }

        .summary-box span {
            display: block;
            font-size: 13px;
            color: var(--muted);
            margin-bottom: 6px;
        }

        .summary-box strong {
            color: #fff;
            font-size: 18px;
            font-weight: 800;
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

        @media (max-width: 992px) {
            .detail-top-grid {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 768px) {
            .metric-grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        @media (max-width: 576px) {
            .metric-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
<nav class="navbar navbar-dark px-3">
    <span class="navbar-brand">Meta Reklam Paneli</span>
    <div class="text-white d-flex align-items-center gap-3">
        <span><?= htmlspecialchars($user['name']) ?></span>
        <a href="dashboard.php?date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>" class="btn btn-sm btn-outline-light">Panele Dön</a>
        <a href="logout.php" class="btn btn-sm btn-outline-light">Çıkış Yap</a>
    </div>
</nav>

<div class="container py-4">
    <div class="page-hero">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
                <h1>Kampanya Detayı</h1>
                <p>Kampanya performansını, ad set kırılımını ve AI yorumlarını premium görünümle incele.</p>
            </div>

            <div class="d-flex flex-wrap gap-2">
                <span class="metric-chip">Kampanya Seviyesi</span>
                <span class="metric-chip">AI Optimizasyon</span>
                <span class="metric-chip">Ad Set Kırılımı</span>
            </div>
        </div>
    </div>

    <?php if ($hata): ?>
        <div class="alert alert-danger"><?= htmlspecialchars($hata) ?></div>
    <?php elseif ($campaign): ?>

        <div class="detail-top-grid">
            <div class="card premium-panel">
                <div class="card-body">
                    <div class="section-title">
                        <h5>Kampanya Özeti</h5>
                        <span class="metric-chip"><?= htmlspecialchars($campaign['campaign_name'] ?? '-') ?></span>
                    </div>

                    <div class="metric-grid">
                        <div class="card stat-card">
                            <div class="card-body">
                                <h6>Kampanya ID</h6>
                                <p><?= htmlspecialchars($campaign['campaign_id'] ?? '-') ?></p>
                            </div>
                        </div>

                        <div class="card stat-card">
                            <div class="card-body">
                                <h6>Harcama</h6>
                                <p><?= number_format((float)($campaign['spend'] ?? 0), 2, ',', '.') ?> ₺</p>
                            </div>
                        </div>

                        <div class="card stat-card">
                            <div class="card-body">
                                <h6>Gösterim</h6>
                                <p><?= number_format((int)($campaign['impressions'] ?? 0), 0, ',', '.') ?></p>
                            </div>
                        </div>

                        <div class="card stat-card">
                            <div class="card-body">
                                <h6>Tıklama</h6>
                                <p><?= number_format((int)($campaign['clicks'] ?? 0), 0, ',', '.') ?></p>
                            </div>
                        </div>

                        <div class="card stat-card">
                            <div class="card-body">
                                <h6>CTR</h6>
                                <p><?= number_format((float)($campaign['ctr'] ?? 0), 2, ',', '.') ?>%</p>
                            </div>
                        </div>

                        <div class="card stat-card">
                            <div class="card-body">
                                <h6>CPC</h6>
                                <p><?= number_format((float)($campaign['cpc'] ?? 0), 2, ',', '.') ?></p>
                            </div>
                        </div>

                        <div class="card stat-card">
                            <div class="card-body">
                                <h6>CPM</h6>
                                <p><?= number_format((float)($campaign['cpm'] ?? 0), 2, ',', '.') ?></p>
                            </div>
                        </div>

                        <div class="card stat-card">
                            <div class="card-body">
                                <h6>Sonuç</h6>
                                <p><?= number_format((float)($campaign['results_count'] ?? 0), 0, ',', '.') ?></p>
                            </div>
                        </div>

                        <div class="card stat-card">
                            <div class="card-body">
                                <h6>ROAS</h6>
                                <p><?= number_format((float)($campaign['roas_value'] ?? 0), 2, ',', '.') ?></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card premium-panel">
                <div class="card-body">
                    <div class="section-title">
                        <h5>Hızlı Bakış</h5>
                        <span class="metric-chip"><?= count($adSets) ?> ad set</span>
                    </div>

                    <div class="d-grid gap-3">
                        <div class="summary-box">
                            <span>En Güçlü Gösterge</span>
                            <strong>
                                <?= (float)($campaign['roas_value'] ?? 0) > 0 ? 'ROAS ' . number_format((float)($campaign['roas_value'] ?? 0), 2, ',', '.') : 'Veri hazırlanıyor' ?>
                            </strong>
                        </div>

                        <div class="summary-box">
                            <span>Hedef Odak</span>
                            <strong>
                                <?= (float)($campaign['results_count'] ?? 0) > 0 ? number_format((float)($campaign['results_count'] ?? 0), 0, ',', '.') . ' sonuç' : 'Henüz sonuç yok' ?>
                            </strong>
                        </div>

                        <div class="summary-box">
                            <span>Verimlilik</span>
                            <strong>
                                <?= (float)($campaign['ctr'] ?? 0) > 0 ? '%' . number_format((float)($campaign['ctr'] ?? 0), 2, ',', '.') . ' CTR' : 'CTR verisi yok' ?>
                            </strong>
                        </div>

                        <div class="summary-box">
                            <span>Hızlı Aksiyon</span>
                            <strong>
                                <a class="text-decoration-none text-white" href="optimize-ads.php?date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>">Optimizasyon Merkezi</a>
                            </strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="analysis-layout">
            <div class="card premium-panel">
                <div class="card-body">
                    <div class="section-title">
                        <h5>AI Kampanya Analizi</h5>

                        <form method="POST" class="mb-0" id="campaignAiForm">
                            <input type="hidden" name="generate_campaign_ai" value="1">
                            <button type="submit" class="btn btn-primary" id="campaignAiButton">AI Analizi Yenile</button>
                        </form>
                    </div>

                    <?php if ($aiAnalysis !== ''): ?>
                        <div class="border rounded p-3 bg-light" style="white-space: pre-wrap;"><?= htmlspecialchars($aiAnalysis) ?></div>
                    <?php else: ?>
                        <div class="text-muted">Bu kampanya için AI yorum almak için butona bas.</div>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <div class="card premium-panel">
            <div class="card-body">
                <div class="section-title">
                    <h5>Ad Set Listesi</h5>
                    <span class="metric-chip"><?= count($adSets) ?> kayıt</span>
                </div>

                <div class="table-responsive">
                    <table class="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>Ad Set</th>
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
                            <?php if (!empty($adSets)): ?>
                                <?php foreach ($adSets as $adSet): ?>
                                    <tr>
                                        <td>
                                            <a
                                                href="adset-detail.php?adset_id=<?= urlencode($adSet['adset_id'] ?? '') ?>&campaign_id=<?= urlencode($campaignId) ?>&date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>"
                                                class="text-decoration-none fw-semibold"
                                            >
                                                <?= htmlspecialchars($adSet['adset_name'] ?? '-') ?>
                                            </a>
                                        </td>
                                        <td><?= number_format((float)($adSet['spend'] ?? 0), 2, ',', '.') ?> ₺</td>
                                        <td><?= number_format((int)($adSet['impressions'] ?? 0), 0, ',', '.') ?></td>
                                        <td><?= number_format((int)($adSet['clicks'] ?? 0), 0, ',', '.') ?></td>
                                        <td><?= number_format((float)($adSet['ctr'] ?? 0), 2, ',', '.') ?>%</td>
                                        <td><?= number_format((float)($adSet['cpc'] ?? 0), 2, ',', '.') ?></td>
                                        <td><?= number_format((float)($adSet['cpm'] ?? 0), 2, ',', '.') ?></td>
                                        <td><?= number_format((float)($adSet['results_count'] ?? 0), 0, ',', '.') ?></td>
                                        <td><?= number_format((float)($adSet['roas_value'] ?? 0), 2, ',', '.') ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="9" class="text-center">Ad set verisi bulunamadı</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <div class="mt-3 d-flex gap-2 flex-wrap">
                    <a href="dashboard.php?date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>" class="btn btn-secondary">Geri Dön</a>
                    <a href="optimize-ads.php?date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>" class="btn btn-warning">AI Optimizasyon Merkezi</a>
                </div>
            </div>
        </div>

    <?php endif; ?>
</div>

<div id="campaignAiLoadingOverlay" class="ai-loading-overlay d-none">
    <div class="ai-loading-modal">
        <div class="ai-progress-wrap">
            <svg class="ai-progress-ring" width="150" height="150">
                <circle class="ai-progress-ring-bg" cx="75" cy="75" r="62"></circle>
                <circle class="ai-progress-ring-fill" cx="75" cy="75" r="62"></circle>
            </svg>
            <div class="ai-progress-text" id="campaignAiProgressText">0%</div>
        </div>

        <h4 class="mt-4 mb-2">Kampanya AI analizi hazırlanıyor</h4>
        <p class="mb-0 text-muted">Lütfen bekleyin, kampanya ve ad set verileri yorumlanıyor...</p>
    </div>
</div>

<script>
(function () {
    const form = document.getElementById('campaignAiForm');
    const overlay = document.getElementById('campaignAiLoadingOverlay');
    const progressText = document.getElementById('campaignAiProgressText');
    const progressCircle = overlay ? overlay.querySelector('.ai-progress-ring-fill') : null;

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
        if (submitted) return;

        e.preventDefault();
        submitted = true;
        startFakeLoading();

        setTimeout(() => {
            form.submit();
        }, 180);
    });

    window.addEventListener('beforeunload', function () {
        setProgress(100);
        if (timer) clearInterval(timer);
    });
})();
</script>
</body>
</html>