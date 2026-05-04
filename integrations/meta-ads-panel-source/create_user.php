<?php
require_once __DIR__ . '/vendor/autoload.php';

use App\Models\User;

$db = require __DIR__ . '/app/config/database.php';

$userModel = new User($db);
$userModel->create('Admin', 'admin@example.com', '123456');

echo "Kullanıcı oluşturuldu.";