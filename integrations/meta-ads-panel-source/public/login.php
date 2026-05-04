<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/helpers/auth.php';

use App\Models\User;

$db = require __DIR__ . '/../app/config/database.php';

if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    $userModel = new User($db);
    $user = $userModel->findByEmail($email);

   if ($user && password_verify($password, $user['password'])) {
    $_SESSION['user'] = [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
    ];

    header('Location: dashboard.php');
    exit;
} else {
    $error = 'E-posta veya şifre hatalı.';
}
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Giriş Yap</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/style.css?v=<?= time() ?>" rel="stylesheet">
    <style>
        .login-shell {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px 16px;
        }

        .login-wrap {
            width: 100%;
            max-width: 1120px;
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 24px;
            align-items: stretch;
        }

        .login-showcase,
        .login-card {
            background: rgba(18, 26, 47, 0.88);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 28px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.35);
            backdrop-filter: blur(16px);
        }

        .login-showcase {
            padding: 40px;
            position: relative;
            overflow: hidden;
            background:
                radial-gradient(circle at top left, rgba(109,93,252,0.28), transparent 30%),
                radial-gradient(circle at bottom right, rgba(0,194,255,0.16), transparent 28%),
                rgba(18, 26, 47, 0.92);
        }

        .login-badge {
            display: inline-flex;
            padding: 8px 14px;
            border-radius: 999px;
            background: rgba(109,93,252,0.14);
            color: #dfe7ff;
            border: 1px solid rgba(109,93,252,0.22);
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 18px;
        }

        .login-showcase h1 {
            font-size: 3rem;
            line-height: 1.08;
            font-weight: 800;
            margin-bottom: 14px;
            color: #fff;
        }

        .login-showcase p {
            color: #a8b5d6;
            font-size: 1rem;
            line-height: 1.7;
            max-width: 540px;
        }

        .feature-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-top: 28px;
        }

        .feature-item {
            padding: 16px;
            border-radius: 18px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
        }

        .feature-item strong {
            display: block;
            color: #fff;
            margin-bottom: 6px;
            font-size: 0.95rem;
        }

        .feature-item span {
            color: #9aa7c7;
            font-size: 0.88rem;
        }

        .login-card {
            padding: 34px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .login-card h2 {
            color: #fff;
            font-weight: 800;
            margin-bottom: 8px;
        }

        .login-card .subtext {
            color: #9aa7c7;
            margin-bottom: 24px;
        }

        .login-footer {
            margin-top: 18px;
            color: #8f9bb9;
            font-size: 0.86rem;
            text-align: center;
        }

        @media (max-width: 992px) {
            .login-wrap {
                grid-template-columns: 1fr;
            }

            .login-showcase {
                padding: 28px;
            }

            .login-showcase h1 {
                font-size: 2.2rem;
            }

            .feature-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
<div class="login-shell">
    <div class="login-wrap">
        <div class="login-showcase">
            <div class="login-badge">AI Destekli Reklam Yönetimi</div>
            <h1>Meta reklamlarını tek panelden yönet.</h1>
            <p>
                Kampanya, ad set ve reklam kırılımını incele. AI analizleri al, performans uyarılarını gör,
                premium rapor üret ve optimizasyon kararlarını daha hızlı ver.
            </p>

            <div class="feature-grid">
                <div class="feature-item">
                    <strong>Canlı Performans</strong>
                    <span>Harcama, CTR, CPC, ROAS ve sonuç verilerini tek ekranda takip et.</span>
                </div>
                <div class="feature-item">
                    <strong>AI Analiz</strong>
                    <span>Kampanya ve ad set seviyesinde otomatik yorum ve aksiyon önerileri al.</span>
                </div>
                <div class="feature-item">
                    <strong>Premium Raporlama</strong>
                    <span>Excel ve PDF çıktı alarak müşteri raporlarını daha profesyonel sun.</span>
                </div>
                <div class="feature-item">
                    <strong>Derin Kırılım</strong>
                    <span>Kampanya, ad set ve reklam bazında detay analize hızlıca ulaş.</span>
                </div>
            </div>
        </div>

        <div class="login-card">
            <h2>Giriş Yap</h2>
            <div class="subtext">Meta Ads Panel hesabına giriş yaparak devam et.</div>

            <?php if ($error): ?>
                <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>

            <form method="POST">
                <div class="mb-3">
                    <label class="form-label">E-posta</label>
                    <input type="email" name="email" class="form-control" placeholder="ornek@mail.com" required>
                </div>

                <div class="mb-4">
                    <label class="form-label">Şifre</label>
                    <input type="password" name="password" class="form-control" placeholder="Şifrenizi girin" required>
                </div>

                <button type="submit" class="btn btn-primary w-100 py-3">
                    Giriş Yap
                </button>
            </form>

            <div class="login-footer">
                Güvenli erişim • Premium panel deneyimi
            </div>
        </div>
    </div>
</div>
</body>
</html>