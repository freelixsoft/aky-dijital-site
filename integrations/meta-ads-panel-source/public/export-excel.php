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

$filename = 'meta-kampanya-raporu-' . date('Y-m-d-H-i-s') . '.csv';

header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');

$output = fopen('php://output', 'w');

fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

fputcsv($output, [
    'Kampanya ID',
    'Kampanya',
    'Harcama',
    'Gösterim',
    'Tıklama',
    'CTR',
    'CPC',
    'CPM',
    'Sonuç',
    'ROAS'
], ';');

foreach ($campaignData as $campaign) {
    fputcsv($output, [
        $campaign['campaign_id'] ?? '',
        $campaign['campaign_name'] ?? '',
        number_format((float)($campaign['spend'] ?? 0), 2, ',', '.'),
        number_format((int)($campaign['impressions'] ?? 0), 0, ',', '.'),
        number_format((int)($campaign['clicks'] ?? 0), 0, ',', '.'),
        number_format((float)($campaign['ctr'] ?? 0), 2, ',', '.') . '%',
        number_format((float)($campaign['cpc'] ?? 0), 2, ',', '.'),
        number_format((float)($campaign['cpm'] ?? 0), 2, ',', '.'),
        number_format((float)($campaign['results_count'] ?? 0), 0, ',', '.'),
        number_format((float)($campaign['roas_value'] ?? 0), 2, ',', '.'),
    ], ';');
}

fclose($output);
exit;