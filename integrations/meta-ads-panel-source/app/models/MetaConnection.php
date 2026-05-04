<?php

namespace App\Models;

use PDO;

class MetaConnection
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getByUserId(int $userId): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM meta_connections WHERE user_id = :user_id LIMIT 1");
        $stmt->execute(['user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    public function save(int $userId, string $accessToken, string $adAccountId): bool
    {
        $existing = $this->getByUserId($userId);

        if ($existing) {
            $stmt = $this->db->prepare("
                UPDATE meta_connections
                SET access_token = :access_token, ad_account_id = :ad_account_id
                WHERE user_id = :user_id
            ");

            return $stmt->execute([
                'user_id' => $userId,
                'access_token' => $accessToken,
                'ad_account_id' => $adAccountId
            ]);
        }

        $stmt = $this->db->prepare("
            INSERT INTO meta_connections (user_id, access_token, ad_account_id)
            VALUES (:user_id, :access_token, :ad_account_id)
        ");

        return $stmt->execute([
            'user_id' => $userId,
            'access_token' => $accessToken,
            'ad_account_id' => $adAccountId
        ]);
    }
}