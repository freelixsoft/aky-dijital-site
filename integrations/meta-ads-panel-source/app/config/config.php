<?php

$env = parse_ini_file(__DIR__ . '/../../.env');

return [
    'app_name' => $env['APP_NAME'] ?? 'MetaAdsPanel',
    'app_url' => $env['APP_URL'] ?? 'http://localhost',
    'meta_app_id' => $env['META_APP_ID'] ?? '',
    'meta_app_secret' => $env['META_APP_SECRET'] ?? '',
    'meta_redirect_uri' => $env['META_REDIRECT_URI'] ?? '',
    'meta_access_token' => $env['META_ACCESS_TOKEN'] ?? '',
];