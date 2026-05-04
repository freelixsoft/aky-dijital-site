<?php

$env = parse_ini_file(__DIR__ . '/../../.env');

try {
    $pdo = new PDO(
        "mysql:host={$env['DB_HOST']};port={$env['DB_PORT']};dbname={$env['DB_NAME']};charset=utf8mb4",
        $env['DB_USER'],
        $env['DB_PASS']
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
} catch (PDOException $e) {
    die('Database connection failed: ' . $e->getMessage());
}