<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/helpers/auth.php';

requireLogin();

use App\Models\MetaConnection;
use App\Services\MetaAdsService;
use App\Services\AIOptimizationService;

$db = require __DIR__ . '/../app/config/database.php';

$user = $_SESSION['user'];

$metaConnectionModel = new MetaConnection($db);
$connection = $metaConnectionModel->getByUserId((int)$user['id']);

$mesaj = '';
$hata = '';

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

$plan = [
    'campaigns' => [],
    'adsets' => [],
    'ads' => [],
];

$summary = [
    'pause_ad' => 0,
    'duplicate_ad_note' => 0,
    'reduce_adset_budget' => 0,
    'refresh_copy_note' => 0,
];

if (!$connection) {
    $hata = 'Önce dashboard üzerinden Meta bağlantısını kaydetmen gerekiyor.';
} else {
    try {
        $metaService = new MetaAdsService();
        $optimizationService = new AIOptimizationService();

        $campaigns = $metaService->fetchInsights(
            $connection['access_token'],
            $connection['ad_account_id'],
            $datePreset,
            $dateFromValue,
            $dateToValue
        );

        $plan = $optimizationService->buildDeepOptimizationPlan(
            $campaigns,
            function (string $campaignId) use ($metaService, $connection, $datePreset, $dateFromValue, $dateToValue): array {
                return $metaService->fetchAdSetsByCampaign(
                    $connection['access_token'],
                    $campaignId,
                    $datePreset,
                    $dateFromValue,
                    $dateToValue
                );
            },
            function (string $adSetId) use ($metaService, $connection, $datePreset, $dateFromValue, $dateToValue): array {
                return $metaService->fetchAdsByAdSet(
                    $connection['access_token'],
                    $adSetId,
                    $datePreset,
                    $dateFromValue,
                    $dateToValue
                );
            },
            function (string $adSetId) use ($metaService, $connection): array {
                return $metaService->getAdSetMeta(
                    $connection['access_token'],
                    $adSetId
                );
            }
        );

        $summary = $optimizationService->summarizeDeepPlan($plan);
    } catch (\Throwable $e) {
        $hata = 'Optimizasyon planı oluşturulamadı: ' . $e->getMessage();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['apply_selected_actions'])) {
    try {
        if (!$connection) {
            throw new \RuntimeException('Meta bağlantısı bulunamadı.');
        }

        $metaService = new MetaAdsService();
        $selectedActions = $_POST['selected_actions'] ?? [];
        $appliedCount = 0;

        foreach ($selectedActions as $encodedAction) {
            $action = json_decode((string)$encodedAction, true);

            if (!is_array($action)) {
                continue;
            }

            $type = (string)($action['type'] ?? '');
            $entityId = (string)($action['entity_id'] ?? '');

            if ($entityId === '') {
                continue;
            }

            if ($type === 'pause_ad') {
                $metaService->updateAdStatus(
                    $connection['access_token'],
                    $entityId,
                    'PAUSED'
                );
                $appliedCount++;
            }

            if ($type === 'reduce_adset_budget') {
                $currentBudget = (int)($action['current_budget'] ?? 0);
                $multiplier = (float)($action['suggested_budget_multiplier'] ?? 0.80);

                if ($currentBudget > 0) {
                    $newBudget = (string)max(100, (int)round($currentBudget * $multiplier));

                    $metaService->updateAdSetBudget(
                        $connection['access_token'],
                        $entityId,
                        $newBudget
                    );
                    $appliedCount++;
                }
            }
        }

        $mesaj = 'Seçilen optimizasyonlar uygulandı. Toplam işlem: ' . $appliedCount;
    } catch (\Throwable $e) {
        $hata = 'Optimizasyon uygulama hatası: ' . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>AI Reklam Optimizasyonu</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/style.css?v=<?= time() ?>" rel="stylesheet">
    <style>
        .optimize-layout {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
        }

        .optimize-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
        }

        .optimize-action-grid {
            display: grid;
            grid-template-columns: 1fr 0.95fr;
            gap: 24px;
        }

        .action-list {
            display: grid;
            gap: 14px;
        }

        .note-stack {
            display: grid;
            gap: 12px;
        }

        @media (max-width: 1100px) {
            .optimize-summary-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .optimize-action-grid {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 640px) {
            .optimize-summary-grid {
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
                <h1>AI Reklam Optimizasyonu</h1>
                <p>Reklam ve ad set seviyesinde önerileri incele, seç ve kontrollü şekilde uygula.</p>
            </div>

            <div class="d-flex flex-wrap gap-2">
                <span class="metric-chip">Seçmeli Uygulama</span>
                <span class="metric-chip">Güvenli Aksiyon</span>
                <span class="metric-chip">Premium Görünüm</span>
            </div>
        </div>
    </div>

    <?php if ($mesaj): ?>
        <div class="alert alert-success"><?= htmlspecialchars($mesaj) ?></div>
    <?php endif; ?>

    <?php if ($hata): ?>
        <div class="alert alert-danger"><?= htmlspecialchars($hata) ?></div>
    <?php endif; ?>

    <div class="optimize-layout">
        <div class="optimize-summary-grid">
            <div class="card stat-card premium-panel">
                <div class="card-body">
                    <h6>Durdurulacak Reklamlar</h6>
                    <h3><?= (int)($summary['pause_ad'] ?? 0) ?></h3>
                </div>
            </div>

            <div class="card stat-card premium-panel">
                <div class="card-body">
                    <h6>Ölçekleme Adayları</h6>
                    <h3><?= (int)($summary['duplicate_ad_note'] ?? 0) ?></h3>
                </div>
            </div>

            <div class="card stat-card premium-panel">
                <div class="card-body">
                    <h6>Bütçesi Düşecek Setler</h6>
                    <h3><?= (int)($summary['reduce_adset_budget'] ?? 0) ?></h3>
                </div>
            </div>

            <div class="card stat-card premium-panel">
                <div class="card-body">
                    <h6>Copy/Kreatif Notları</h6>
                    <h3><?= (int)($summary['refresh_copy_note'] ?? 0) ?></h3>
                </div>
            </div>
        </div>

        <form method="POST">
            <div class="optimize-action-grid">
                <div class="card premium-panel">
                    <div class="card-body">
                        <div class="section-title">
                            <h5>Uygulanabilir Aksiyonlar</h5>
                            <span class="metric-chip">Checkbox ile seç</span>
                        </div>

                        <?php if (empty($plan['ads']) && empty($plan['adsets'])): ?>
                            <div class="text-muted">Şu an uygulanabilir bir optimizasyon aksiyonu bulunamadı.</div>
                        <?php else: ?>
                            <div class="action-list">
                                <?php foreach ($plan['ads'] as $action): ?>
                                    <?php if ($action['type'] === 'pause_ad'): ?>
                                        <div class="form-check p-3">
                                            <input
                                                class="form-check-input"
                                                type="checkbox"
                                                name="selected_actions[]"
                                                value="<?= htmlspecialchars(json_encode($action, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8') ?>"
                                                id="action_<?= md5(json_encode($action)) ?>"
                                            >
                                            <label class="form-check-label ms-2" for="action_<?= md5(json_encode($action)) ?>">
                                                <strong><?= htmlspecialchars($action['entity_name'] ?? '-') ?></strong><br>
                                                <span><?= htmlspecialchars($action['impact'] ?? '-') ?></span><br>
                                                <small>
                                                    Kampanya: <?= htmlspecialchars($action['campaign_name'] ?? '-') ?> |
                                                    Ad Set: <?= htmlspecialchars($action['adset_name'] ?? '-') ?><br>
                                                    <?= htmlspecialchars($action['reason'] ?? '-') ?>
                                                </small>
                                            </label>
                                        </div>
                                    <?php endif; ?>
                                <?php endforeach; ?>

                                <?php foreach ($plan['adsets'] as $action): ?>
                                    <div class="form-check p-3">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            name="selected_actions[]"
                                            value="<?= htmlspecialchars(json_encode($action, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8') ?>"
                                            id="action_<?= md5(json_encode($action)) ?>"
                                        >
                                        <label class="form-check-label ms-2" for="action_<?= md5(json_encode($action)) ?>">
                                            <strong><?= htmlspecialchars($action['entity_name'] ?? '-') ?></strong><br>
                                            <span><?= htmlspecialchars($action['impact'] ?? '-') ?></span><br>
                                            <small>
                                                Kampanya: <?= htmlspecialchars($action['campaign_name'] ?? '-') ?><br>
                                                <?= htmlspecialchars($action['reason'] ?? '-') ?><br>
                                                Mevcut bütçe: <?= number_format((int)($action['current_budget'] ?? 0), 0, ',', '.') ?>
                                            </small>
                                        </label>
                                    </div>
                                <?php endforeach; ?>
                            </div>

                            <div class="alert alert-warning mt-4 mb-3">
                                Seçtiğin aksiyonlar gerçekten uygulanır. Checkbox seçmeden hiçbir işlem yapılmaz.
                            </div>

                            <button type="submit" name="apply_selected_actions" value="1" class="btn btn-danger">
                                Seçilen Aksiyonları Uygula
                            </button>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="card premium-panel">
                    <div class="card-body">
                        <div class="section-title">
                            <h5>AI Notları</h5>
                            <span class="metric-chip">Manuel değerlendirme</span>
                        </div>

                        <div class="note-stack">
                            <?php
                            $hasNotes = false;
                            foreach ($plan['ads'] as $action):
                                if (in_array($action['type'], ['duplicate_ad_note', 'refresh_copy_note'], true)):
                                    $hasNotes = true;
                            ?>
                                <div class="alert alert-warning mb-0">
                                    <strong><?= htmlspecialchars($action['entity_name'] ?? '-') ?></strong><br>
                                    <?= htmlspecialchars($action['impact'] ?? '-') ?> — <?= htmlspecialchars($action['reason'] ?? '-') ?>
                                </div>
                            <?php
                                endif;
                            endforeach;
                            ?>

                            <?php if (!$hasNotes): ?>
                                <div class="text-muted">Şu an ek manuel değerlendirme notu yok.</div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</div>
</body>
</html>