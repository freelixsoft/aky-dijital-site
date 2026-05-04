<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/helpers/auth.php';

requireLogin();

use App\Models\MetaConnection;
use App\Models\CampaignCache;
use App\Services\MetaAdsService;
use App\Services\OpenAIAnalysisService;

$db = require __DIR__ . '/../app/config/database.php';

$user = $_SESSION['user'];

$metaConnectionModel = new MetaConnection($db);
$campaignCacheModel = new CampaignCache($db);
$connection = $metaConnectionModel->getByUserId((int)$user['id']);

$datePreset = $_GET['date_preset'] ?? 'last_30d';
$dateFrom = $_GET['date_from'] ?? '';
$dateTo = $_GET['date_to'] ?? '';

$dateFromValue = $datePreset === 'custom' ? $dateFrom : null;
$dateToValue = $datePreset === 'custom' ? $dateTo : null;

if (!isset($_SESSION['ai_chat_history'])) {
    $_SESSION['ai_chat_history'] = [];
}

if (isset($_POST['clear_chat'])) {
    $_SESSION['ai_chat_history'] = [];
    header('Location: ai-chat.php?date_preset=' . urlencode($datePreset) . '&date_from=' . urlencode($dateFrom) . '&date_to=' . urlencode($dateTo));
    exit;
}

$chatHistory = $_SESSION['ai_chat_history'];
$hata = '';
$campaignData = [];

if ($connection) {
    try {
        $campaignData = $campaignCacheModel->getByFilter(
            (int)$user['id'],
            $datePreset,
            $dateFromValue,
            $dateToValue
        );

        if (empty($campaignData)) {
            $metaService = new MetaAdsService();
            $campaignData = $metaService->fetchInsights(
                $connection['access_token'],
                $connection['ad_account_id'],
                $datePreset,
                $dateFromValue,
                $dateToValue
            );
        }
    } catch (\Throwable $e) {
        $hata = 'Veriler alınamadı: ' . $e->getMessage();
    }
} else {
    $hata = 'Meta bağlantısı bulunamadı.';
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

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['chat_message'])) {
    $userMessage = trim($_POST['chat_message']);

    if ($userMessage !== '') {
        $topCampaigns = array_slice($campaignData, 0, 10);
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

        $systemContext = "Kullanıcı Meta Ads Panel kullanıyor.\n"
            . "Filtre: {$datePreset}\n"
            . "Toplam Harcama: " . number_format($totalSpend, 2, '.', '') . "\n"
            . "Toplam Gösterim: " . number_format($totalImpressions, 0, '.', '') . "\n"
            . "Toplam Tıklama: " . number_format($totalClicks, 0, '.', '') . "\n"
            . "Toplam Sonuç: " . number_format($totalResults, 0, '.', '') . "\n"
            . "Ortalama CTR: " . number_format($avgCtr, 2, '.', '') . "\n"
            . "Ortalama ROAS: " . number_format($avgRoas, 2, '.', '') . "\n"
            . "Kampanya Özetleri:\n" . implode("\n", $campaignLines);

        $_SESSION['ai_chat_history'][] = [
            'role' => 'user',
            'content' => $userMessage,
        ];

        try {
            $service = new OpenAIAnalysisService();
            $assistantReply = $service->generateChatReply(
                $systemContext,
                array_slice($_SESSION['ai_chat_history'], -10),
                $userMessage
            );

            $_SESSION['ai_chat_history'][] = [
                'role' => 'assistant',
                'content' => $assistantReply,
            ];
        } catch (\Throwable $e) {
            $_SESSION['ai_chat_history'][] = [
                'role' => 'assistant',
                'content' => 'AI chat yanıtı üretilemedi: ' . $e->getMessage(),
            ];
        }

        header('Location: ai-chat.php?date_preset=' . urlencode($datePreset) . '&date_from=' . urlencode($dateFrom) . '&date_to=' . urlencode($dateTo));
        exit;
    }
}

$chatHistory = $_SESSION['ai_chat_history'];
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>AI Chat</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/style.css?v=<?= time() ?>" rel="stylesheet">
    <style>
        .chat-layout {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 24px;
        }

        .chat-sidebar,
        .chat-main {
            background: rgba(18, 26, 47, 0.92);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 24px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.28);
        }

        .chat-sidebar .card-body,
        .chat-main .card-body {
            padding: 22px;
        }

        .chat-messages {
            display: flex;
            flex-direction: column;
            gap: 14px;
            max-height: 70vh;
            overflow-y: auto;
            padding-right: 4px;
        }

        .chat-bubble {
            padding: 14px 16px;
            border-radius: 18px;
            white-space: pre-wrap;
            line-height: 1.6;
        }

        .chat-user {
            background: rgba(109,93,252,0.18);
            border: 1px solid rgba(109,93,252,0.26);
            color: #fff;
            align-self: flex-end;
            max-width: 80%;
        }

        .chat-assistant {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            color: #eef3ff;
            align-self: flex-start;
            max-width: 88%;
        }

        .chat-form textarea {
            min-height: 110px;
            resize: vertical;
        }

        .quick-q {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .quick-q button {
            border-radius: 999px;
        }

        @media (max-width: 992px) {
            .chat-layout {
                grid-template-columns: 1fr;
            }

            .chat-messages {
                max-height: 55vh;
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
                <h1>AI Chat</h1>
                <p>Reklam hesabınla sohbet et. Kampanyaları, riskleri ve optimizasyon fırsatlarını doğal dilde sor.</p>
            </div>

            <div class="d-flex flex-wrap gap-2">
                <span class="metric-chip">Konuşmalı Analiz</span>
                <span class="metric-chip">Bağlama Duyarlı</span>
                <span class="metric-chip">Meta Verisine Dayalı</span>
            </div>
        </div>
    </div>

    <?php if ($hata): ?>
        <div class="alert alert-danger"><?= htmlspecialchars($hata) ?></div>
    <?php endif; ?>

    <div class="chat-layout">
        <div class="chat-sidebar card">
            <div class="card-body">
                <div class="section-title">
                    <h5>Hızlı Sorular</h5>
                    <span class="metric-chip"><?= count($campaignData) ?> kampanya</span>
                </div>

                <div class="quick-q mb-3">
                    <form method="POST">
                        <input type="hidden" name="chat_message" value="Bu hesapta en iyi kampanya hangisi?">
                        <button class="btn btn-outline-primary btn-sm">En iyi kampanya?</button>
                    </form>

                    <form method="POST">
                        <input type="hidden" name="chat_message" value="Hangi kampanyaları durdurmayı düşünmeliyim?">
                        <button class="btn btn-outline-primary btn-sm">Hangisini durdurayım?</button>
                    </form>

                    <form method="POST">
                        <input type="hidden" name="chat_message" value="Bütçeyi hangi kampanyalara artırmalıyım?">
                        <button class="btn btn-outline-primary btn-sm">Neye bütçe artar?</button>
                    </form>

                    <form method="POST">
                        <input type="hidden" name="chat_message" value="Bu hesapta en büyük problem ne görünüyor?">
                        <button class="btn btn-outline-primary btn-sm">Ana problem ne?</button>
                    </form>
                </div>

                <div class="summary-box mb-3">
                    <span>Toplam Harcama</span>
                    <strong><?= number_format($totalSpend, 2, ',', '.') ?> ₺</strong>
                </div>

                <div class="summary-box mb-3">
                    <span>Toplam Sonuç</span>
                    <strong><?= number_format($totalResults, 0, ',', '.') ?></strong>
                </div>

                <div class="summary-box mb-3">
                    <span>Ortalama ROAS</span>
                    <strong><?= number_format($avgRoas, 2, ',', '.') ?></strong>
                </div>

                <form method="POST">
                    <input type="hidden" name="clear_chat" value="1">
                    <button type="submit" class="btn btn-danger w-100">Sohbeti Temizle</button>
                </form>
            </div>
        </div>

        <div class="chat-main card">
            <div class="card-body">
                <div class="section-title">
                    <h5>Konuşma</h5>
                    <span class="metric-chip"><?= htmlspecialchars($datePreset) ?></span>
                </div>

                <div class="chat-messages mb-4">
                    <?php if (empty($chatHistory)): ?>
                        <div class="chat-bubble chat-assistant">
                            Merhaba. Bu reklam hesabını birlikte analiz edebiliriz. Bana örneğin şunları sorabilirsin:
                            - En iyi kampanya hangisi?
                            - En riskli alan ne?
                            - Bütçeyi nereye kaydırmalıyım?
                            - Sonuç üretmeyen kampanyalar hangileri?
                        </div>
                    <?php else: ?>
                        <?php foreach ($chatHistory as $message): ?>
                            <div class="chat-bubble <?= $message['role'] === 'user' ? 'chat-user' : 'chat-assistant' ?>">
                                <?= htmlspecialchars($message['content']) ?>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <form method="POST" class="chat-form" id="aiChatForm">
                    <label class="form-label">Mesajın</label>
                    <textarea name="chat_message" class="form-control mb-3" placeholder="Örn: Son 7 günde hangi kampanyaya bütçe artırmalıyım?"></textarea>
                    <button type="submit" class="btn btn-primary">Gönder</button>
                </form>
            </div>
        </div>
    </div>
</div>
<div id="aiChatLoadingOverlay" class="ai-loading-overlay d-none">
    <div class="ai-loading-modal">
        <div class="ai-progress-wrap">
            <svg class="ai-progress-ring" width="150" height="150">
                <circle class="ai-progress-ring-bg" cx="75" cy="75" r="62"></circle>
                <circle class="ai-progress-ring-fill" cx="75" cy="75" r="62"></circle>
            </svg>
            <div class="ai-progress-text" id="aiChatProgressText">0%</div>
        </div>

        <h4 class="mt-4 mb-2">AI yanıt hazırlanıyor</h4>
        <p class="mb-0 text-muted">Lütfen bekleyin, sohbet yanıtı oluşturuluyor...</p>
    </div>
</div>
<script>
(function () {
    const form = document.getElementById('aiChatForm');
    const overlay = document.getElementById('aiChatLoadingOverlay');
    const progressText = document.getElementById('aiChatProgressText');
    const progressCircle = overlay ? overlay.querySelector('.ai-progress-ring-fill') : null;

    if (!form || !overlay || !progressText || !progressCircle) {
        return;
    }

    const textarea = form.querySelector('textarea[name="chat_message"]');
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
        const message = textarea ? textarea.value.trim() : '';

        if (!message || submitted) {
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
        if (timer) clearInterval(timer);
    });
})();
</script>	
</body>
</html>