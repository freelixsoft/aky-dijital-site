<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/helpers/auth.php';

requireLogin();

use App\Models\CampaignCache;
use App\Models\MetaConnection;
use App\Services\MetaAdsService;

$db = require __DIR__ . '/../app/config/database.php';

$user = $_SESSION['user'];

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

$metaConnectionModel = new MetaConnection($db);
$campaignCacheModel = new CampaignCache($db);
$connection = $metaConnectionModel->getByUserId((int)$user['id']);

if (!$connection) {
    die('Meta bağlantısı bulunamadı.');
}

$dateFromValue = $datePreset === 'custom' ? $dateFrom : null;
$dateToValue = $datePreset === 'custom' ? $dateTo : null;

$campaignData = $campaignCacheModel->getByFilter(
    (int)$user['id'],
    $datePreset,
    $dateFromValue,
    $dateToValue
);

if (empty($campaignData)) {
    try {
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
    } catch (\Throwable $e) {
        die('Veri alınamadı: ' . $e->getMessage());
    }
}

$totalSpend = 0;
$totalImpressions = 0;
$totalClicks = 0;
$totalResults = 0;
$totalRoas = 0;
$avgCtr = 0;
$avgRoas = 0;

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

function formatPresetLabel(string $preset): string
{
    return match ($preset) {
        'today' => 'Bugün',
        'yesterday' => 'Dün',
        'last_7d' => 'Son 7 Gün',
        'last_14d' => 'Son 14 Gün',
        'last_30d' => 'Son 30 Gün',
        'this_month' => 'Bu Ay',
        'last_month' => 'Geçen Ay',
        'custom' => 'Özel Aralık',
        default => 'Son 30 Gün',
    };
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Meta Reklam Raporu</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #222;
            margin: 30px;
        }

        h1, h2, h3 {
            margin-bottom: 10px;
        }

        .meta {
            margin-bottom: 20px;
            color: #555;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }

        .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
        }

        .card h4 {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #666;
        }

        .card p {
            margin: 0;
            font-size: 20px;
            font-weight: bold;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 12px;
            text-align: left;
        }

        th {
            background: #f5f5f5;
        }

        .actions {
            margin-bottom: 20px;
        }

        .actions button,
        .actions a {
            padding: 10px 14px;
            border: 1px solid #333;
            background: white;
            color: #111;
            text-decoration: none;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 8px;
        }

        @media print {
            .actions {
                display: none;
            }

            body {
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="actions">
        <button onclick="window.print()">PDF Olarak Kaydet / Yazdır</button>
        <a href="dashboard.php?date_preset=<?= urlencode($datePreset) ?>&date_from=<?= urlencode($dateFrom) ?>&date_to=<?= urlencode($dateTo) ?>">Panele Dön</a>
    </div>

    <h1>Meta Reklam Raporu</h1>
    <div class="meta">
        <div><strong>Kullanıcı:</strong> <?= htmlspecialchars($user['name']) ?></div>
        <div><strong>Filtre:</strong> <?= htmlspecialchars(formatPresetLabel($datePreset)) ?></div>
        <?php if ($datePreset === 'custom'): ?>
            <div><strong>Tarih Aralığı:</strong> <?= htmlspecialchars($dateFrom) ?> - <?= htmlspecialchars($dateTo) ?></div>
        <?php endif; ?>
        <div><strong>Rapor Tarihi:</strong> <?= date('d.m.Y H:i') ?></div>
    </div>

    <h2>Özet</h2>
    <div class="summary">
        <div class="card">
            <h4>Toplam Harcama</h4>
            <p><?= number_format($totalSpend, 2, ',', '.') ?> ₺</p>
        </div>

        <div class="card">
            <h4>Toplam Gösterim</h4>
            <p><?= number_format($totalImpressions, 0, ',', '.') ?></p>
        </div>

        <div class="card">
            <h4>Toplam Tıklama</h4>
            <p><?= number_format($totalClicks, 0, ',', '.') ?></p>
        </div>

        <div class="card">
            <h4>CTR</h4>
            <p><?= number_format($avgCtr, 2, ',', '.') ?>%</p>
        </div>

        <div class="card">
            <h4>Sonuç</h4>
            <p><?= number_format($totalResults, 0, ',', '.') ?></p>
        </div>

        <div class="card">
            <h4>Ortalama ROAS</h4>
            <p><?= number_format($avgRoas, 2, ',', '.') ?></p>
        </div>
    </div>

    <h2>Kampanya Listesi</h2>
    <table>
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
                        <td><?= htmlspecialchars($campaign['campaign_name'] ?? '-') ?></td>
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
                    <td colspan="9">Veri bulunamadı</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</body>
</html>