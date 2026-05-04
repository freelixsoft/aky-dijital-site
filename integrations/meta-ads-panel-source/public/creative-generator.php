<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/helpers/auth.php';

requireLogin();

use App\Services\OpenAIImageService;

$user = $_SESSION['user'];

$mesaj = '';
$hata = '';
$result = null;

$form = [
    'brand_name' => '',
    'product_name' => '',
    'product_description' => '',
    'ad_text' => '',
    'headline' => '',
    'cta_text' => '',
    'target_audience' => '',
    'style' => 'premium-minimal',
    'size' => '1080x1080',
];

$allowedSizes = ['1080x1080', '1080x1920'];
$allowedStyles = [
    'premium-minimal' => 'Premium Minimal',
    'modern-ecommerce' => 'Modern E-commerce',
    'bold-conversion' => 'Bold Conversion',
    'luxury-clean' => 'Luxury Clean',
    'social-media' => 'Social Media',
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $form['brand_name'] = trim($_POST['brand_name'] ?? '');
    $form['product_name'] = trim($_POST['product_name'] ?? '');
    $form['product_description'] = trim($_POST['product_description'] ?? '');
    $form['ad_text'] = trim($_POST['ad_text'] ?? '');
    $form['headline'] = trim($_POST['headline'] ?? '');
    $form['cta_text'] = trim($_POST['cta_text'] ?? '');
    $form['target_audience'] = trim($_POST['target_audience'] ?? '');
    $form['style'] = trim($_POST['style'] ?? 'premium-minimal');
    $form['size'] = trim($_POST['size'] ?? '1080x1080');

    $uploadedFile = $_FILES['product_image'] ?? null;

    if ($form['brand_name'] === '') {
        $hata = 'Marka adı zorunlu.';
    } elseif ($form['product_name'] === '') {
        $hata = 'Ürün adı zorunlu.';
    } elseif ($form['product_description'] === '') {
        $hata = 'Ürün açıklaması zorunlu.';
    } elseif ($form['headline'] === '') {
        $hata = 'Headline zorunlu.';
    } elseif ($form['cta_text'] === '') {
        $hata = 'CTA metni zorunlu.';
    } elseif (!in_array($form['size'], $allowedSizes, true)) {
        $hata = 'Geçersiz boyut seçimi.';
    } elseif (!array_key_exists($form['style'], $allowedStyles)) {
        $hata = 'Geçersiz stil seçimi.';
    } elseif (!$uploadedFile || (int)($uploadedFile['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        $hata = 'Ürün görseli yüklemen gerekiyor.';
    } else {
        try {
            $imageService = new OpenAIImageService();

            $result = $imageService->generateCreative([
                'brand_name' => $form['brand_name'],
                'product_name' => $form['product_name'],
                'product_description' => $form['product_description'],
                'ad_text' => $form['ad_text'],
                'headline' => $form['headline'],
                'cta_text' => $form['cta_text'],
                'target_audience' => $form['target_audience'],
                'style' => $form['style'],
                'size' => $form['size'],
                'user_id' => (int)($user['id'] ?? 0),
            ], $uploadedFile);

            if (!empty($result['success'])) {
                $mesaj = 'AI kreatif başarıyla üretildi.';
            } else {
                $hata = $result['error'] ?? 'Kreatif üretilemedi.';
            }
        } catch (\Throwable $e) {
            $hata = 'Kreatif üretim hatası: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>AI Kreatif Oluştur</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/style.css?v=<?= time() ?>" rel="stylesheet">
    <style>
        .creative-grid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 24px;
        }

        .preview-card img {
            width: 100%;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
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
            .creative-grid {
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
        <a href="dashboard.php" class="btn btn-sm btn-outline-light">Panele Dön</a>
        <a href="logout.php" class="btn btn-sm btn-outline-light">Çıkış Yap</a>
    </div>
</nav>

<div class="container py-4">
    <div class="page-hero mb-4">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
                <h1>AI Kreatif Oluştur</h1>
                <p>Ürün görseli ve brief bilgileriyle Meta için hızlı kreatif üret.</p>
            </div>

            <div class="d-flex flex-wrap gap-2">
                <span class="metric-chip">Image Generation</span>
                <span class="metric-chip">1080x1080</span>
                <span class="metric-chip">1080x1920</span>
            </div>
        </div>
    </div>

    <?php if ($mesaj): ?>
        <div class="alert alert-success"><?= htmlspecialchars($mesaj) ?></div>
    <?php endif; ?>

    <?php if ($hata): ?>
        <div class="alert alert-danger" style="white-space: pre-wrap;"><?= htmlspecialchars($hata) ?></div>
    <?php endif; ?>

    <div class="creative-grid">
        <div class="card">
            <div class="card-body">
                <div class="section-title">
                    <h5>Kreatif Brief</h5>
                    <span class="metric-chip">İlk Sürüm</span>
                </div>

                <form method="POST" enctype="multipart/form-data" id="creativeForm">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Marka Adı</label>
                            <input
                                type="text"
                                name="brand_name"
                                class="form-control"
                                value="<?= htmlspecialchars($form['brand_name']) ?>"
                                placeholder="Örn: Nuru Groups"
                                required
                            >
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Ürün Adı</label>
                            <input
                                type="text"
                                name="product_name"
                                class="form-control"
                                value="<?= htmlspecialchars($form['product_name']) ?>"
                                placeholder="Örn: Saç bakım serumu"
                                required
                            >
                        </div>

                        <div class="col-12">
                            <label class="form-label">Ürün Görseli</label>
                            <input
                                type="file"
                                name="product_image"
                                class="form-control"
                                accept=".jpg,.jpeg,.png,.webp"
                                required
                            >
                            <small class="text-muted">JPG, JPEG, PNG veya WEBP yükleyebilirsin.</small>
                        </div>

                        <div class="col-12">
                            <label class="form-label">Ürün Açıklaması</label>
                            <textarea
                                name="product_description"
                                class="form-control"
                                rows="4"
                                placeholder="Ürün ne işe yarıyor, öne çıkan faydaları neler?"
                                required
                            ><?= htmlspecialchars($form['product_description']) ?></textarea>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Headline</label>
                            <input
                                type="text"
                                name="headline"
                                class="form-control"
                                value="<?= htmlspecialchars($form['headline']) ?>"
                                placeholder="Örn: Daha parlak ve güçlü saçlar"
                                required
                            >
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">CTA Metni</label>
                            <input
                                type="text"
                                name="cta_text"
                                class="form-control"
                                value="<?= htmlspecialchars($form['cta_text']) ?>"
                                placeholder="Örn: Şimdi Satın Al"
                                required
                            >
                        </div>

                        <div class="col-12">
                            <label class="form-label">Reklam Metni</label>
                            <textarea
                                name="ad_text"
                                class="form-control"
                                rows="3"
                                placeholder="Kreatifte görünmesini istediğin kısa metin"
                            ><?= htmlspecialchars($form['ad_text']) ?></textarea>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Hedef Kitle</label>
                            <textarea
                                name="target_audience"
                                class="form-control"
                                rows="3"
                                placeholder="Örn: 25-40 yaş kadın, e-ticaret alışverişine yatkın"
                            ><?= htmlspecialchars($form['target_audience']) ?></textarea>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Stil</label>
                            <select name="style" class="form-select">
                                <?php foreach ($allowedStyles as $styleKey => $styleLabel): ?>
                                    <option value="<?= htmlspecialchars($styleKey) ?>" <?= $form['style'] === $styleKey ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($styleLabel) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Boyut</label>
                            <select name="size" class="form-select">
                                <option value="1080x1080" <?= $form['size'] === '1080x1080' ? 'selected' : '' ?>>1080x1080</option>
                                <option value="1080x1920" <?= $form['size'] === '1080x1920' ? 'selected' : '' ?>>1080x1920</option>
                            </select>
                        </div>

                        <div class="col-12 d-flex gap-2 flex-wrap">
                            <button type="submit" class="btn btn-primary">AI Kreatif Oluştur</button>
                            <a href="dashboard.php" class="btn btn-outline-light">Vazgeç</a>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <div class="card preview-card">
            <div class="card-body">
                <div class="section-title">
                    <h5>Önizleme ve Çıktı</h5>
                    <span class="metric-chip">Tıklayıp İndir</span>
                </div>

                <?php if ($result && !empty($result['success']) && !empty($result['generated_web_path'])): ?>
                    <div class="mb-3 text-center">
                        <a
                            href="<?= htmlspecialchars($result['generated_web_path']) ?>?v=<?= time() ?>"
                            download
                            target="_blank"
                            title="Görseli indir"
                        >
                            <img
                                src="<?= htmlspecialchars($result['generated_web_path']) ?>?v=<?= time() ?>"
                                alt="AI Kreatif Önizleme"
                                style="cursor:pointer;"
                            >
                        </a>
                    </div>

                    <div class="d-grid">
                        <a
                            href="<?= htmlspecialchars($result['generated_web_path']) ?>?v=<?= time() ?>"
                            download
                            target="_blank"
                            class="btn btn-primary"
                        >
                            Görseli İndir
                        </a>
                    </div>
                <?php else: ?>
                    <div class="alert alert-secondary mb-0">
                        Formu doldurup üretim başlattığında burada sadece kreatif önizlemesi görünecek.
                    </div>
                <?php endif; ?>
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

        <h4 class="mt-4 mb-2">AI kreatif hazırlanıyor</h4>
        <p class="mb-0 text-muted" id="aiLoadingMessage">Görsel işleniyor ve kompozisyon hazırlanıyor...</p>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
(function () {
    const form = document.getElementById('creativeForm');
    const overlay = document.getElementById('aiLoadingOverlay');
    const progressText = document.getElementById('aiProgressText');
    const progressCircle = document.querySelector('.ai-progress-ring-fill');
    const loadingMessage = document.getElementById('aiLoadingMessage');

    if (!form || !overlay || !progressText || !progressCircle || !loadingMessage) {
        return;
    }

    const radius = 62;
    const circumference = 2 * Math.PI * radius;

    progressCircle.style.strokeDasharray = String(circumference);
    progressCircle.style.strokeDashoffset = String(circumference);

    const messages = [
        'Ürün görseli kontrol ediliyor...',
        'Kreatif kompozisyonu hazırlanıyor...',
        'AI görsel üretimi çalışıyor...',
        'Çıktı hedef boyuta uyarlanıyor...',
        'Önizleme hazırlanıyor...'
    ];

    let progress = 0;
    let timer = null;
    let submitted = false;
    let messageIndex = 0;

    function setProgress(value) {
        const bounded = Math.max(0, Math.min(100, value));
        const offset = circumference - (bounded / 100) * circumference;
        progressCircle.style.strokeDashoffset = String(offset);
        progressText.textContent = Math.floor(bounded) + '%';
    }

    function startFakeLoading() {
        overlay.classList.remove('d-none');
        overlay.style.display = 'flex';

        progress = 7;
        setProgress(progress);
        loadingMessage.textContent = messages[0];

        timer = setInterval(() => {
            if (progress < 30) {
                progress += Math.random() * 9;
            } else if (progress < 65) {
                progress += Math.random() * 5.5;
            } else if (progress < 88) {
                progress += Math.random() * 2.3;
            } else if (progress < 95) {
                progress += Math.random() * 0.7;
            }

            if (progress > 95) {
                progress = 95;
            }

            if (messageIndex < messages.length - 1 && progress > (messageIndex + 1) * 18) {
                messageIndex++;
                loadingMessage.textContent = messages[messageIndex];
            }

            setProgress(progress);
        }, 160);
    }

    form.addEventListener('submit', function (e) {
        if (submitted) {
            return;
        }

        submitted = true;
        startFakeLoading();
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