<?php

namespace App\Models;

use PDO;

class CampaignCache
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function clearByFilter(int $userId, string $datePreset, ?string $dateFrom = null, ?string $dateTo = null): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM campaign_cache
            WHERE user_id = :user_id
              AND date_preset = :date_preset
              AND (
                    (:date_from IS NULL AND date_from IS NULL) OR date_from = :date_from
                  )
              AND (
                    (:date_to IS NULL AND date_to IS NULL) OR date_to = :date_to
                  )
        ");

        return $stmt->execute([
            'user_id' => $userId,
            'date_preset' => $datePreset,
            'date_from' => $dateFrom ?: null,
            'date_to' => $dateTo ?: null,
        ]);
    }

    public function saveMany(int $userId, array $campaignData, string $datePreset, ?string $dateFrom = null, ?string $dateTo = null): void
    {
        $this->clearByFilter($userId, $datePreset, $dateFrom, $dateTo);

        $stmt = $this->db->prepare("
            INSERT INTO campaign_cache (
                user_id, campaign_id, campaign_name, spend, impressions, clicks, ctr, cpc, cpm,
                results_count, roas_value, date_preset, date_from, date_to
            ) VALUES (
                :user_id, :campaign_id, :campaign_name, :spend, :impressions, :clicks, :ctr, :cpc, :cpm,
                :results_count, :roas_value, :date_preset, :date_from, :date_to
            )
        ");

        foreach ($campaignData as $campaign) {
            $stmt->execute([
                'user_id' => $userId,
                'campaign_id' => $campaign['campaign_id'] ?? '',
                'campaign_name' => $campaign['campaign_name'] ?? '-',
                'spend' => (float)($campaign['spend'] ?? 0),
                'impressions' => (int)($campaign['impressions'] ?? 0),
                'clicks' => (int)($campaign['clicks'] ?? 0),
                'ctr' => (float)($campaign['ctr'] ?? 0),
                'cpc' => (float)($campaign['cpc'] ?? 0),
                'cpm' => (float)($campaign['cpm'] ?? 0),
                'results_count' => (float)($campaign['results_count'] ?? 0),
                'roas_value' => (float)($campaign['roas_value'] ?? 0),
                'date_preset' => $datePreset,
                'date_from' => $dateFrom ?: null,
                'date_to' => $dateTo ?: null,
            ]);
        }
    }

    public function getByFilter(int $userId, string $datePreset, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM campaign_cache
            WHERE user_id = :user_id
              AND date_preset = :date_preset
              AND (
                    (:date_from IS NULL AND date_from IS NULL) OR date_from = :date_from
                  )
              AND (
                    (:date_to IS NULL AND date_to IS NULL) OR date_to = :date_to
                  )
            ORDER BY spend DESC, campaign_name ASC
        ");

        $stmt->execute([
            'user_id' => $userId,
            'date_preset' => $datePreset,
            'date_from' => $dateFrom ?: null,
            'date_to' => $dateTo ?: null,
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }
}