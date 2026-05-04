<?php

namespace App\Models;

use PDO;

class AIDetailAnalysisCache
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getByFilter(
        int $userId,
        string $entityType,
        string $entityId,
        string $datePreset,
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): ?array {
        $stmt = $this->db->prepare("
            SELECT *
            FROM ai_detail_analysis_cache
            WHERE user_id = :user_id
              AND entity_type = :entity_type
              AND entity_id = :entity_id
              AND date_preset = :date_preset
              AND ((:date_from IS NULL AND date_from IS NULL) OR date_from = :date_from)
              AND ((:date_to IS NULL AND date_to IS NULL) OR date_to = :date_to)
            LIMIT 1
        ");

        $stmt->execute([
            'user_id' => $userId,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'date_preset' => $datePreset,
            'date_from' => $dateFrom ?: null,
            'date_to' => $dateTo ?: null,
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    public function save(
        int $userId,
        string $entityType,
        string $entityId,
        string $datePreset,
        ?string $dateFrom,
        ?string $dateTo,
        string $analysisText
    ): bool {
        $existing = $this->getByFilter($userId, $entityType, $entityId, $datePreset, $dateFrom, $dateTo);

        if ($existing) {
            $stmt = $this->db->prepare("
                UPDATE ai_detail_analysis_cache
                SET analysis_text = :analysis_text
                WHERE user_id = :user_id
                  AND entity_type = :entity_type
                  AND entity_id = :entity_id
                  AND date_preset = :date_preset
                  AND ((:date_from IS NULL AND date_from IS NULL) OR date_from = :date_from)
                  AND ((:date_to IS NULL AND date_to IS NULL) OR date_to = :date_to)
            ");

            return $stmt->execute([
                'user_id' => $userId,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'date_preset' => $datePreset,
                'date_from' => $dateFrom ?: null,
                'date_to' => $dateTo ?: null,
                'analysis_text' => $analysisText,
            ]);
        }

        $stmt = $this->db->prepare("
            INSERT INTO ai_detail_analysis_cache (
                user_id, entity_type, entity_id, date_preset, date_from, date_to, analysis_text
            ) VALUES (
                :user_id, :entity_type, :entity_id, :date_preset, :date_from, :date_to, :analysis_text
            )
        ");

        return $stmt->execute([
            'user_id' => $userId,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'date_preset' => $datePreset,
            'date_from' => $dateFrom ?: null,
            'date_to' => $dateTo ?: null,
            'analysis_text' => $analysisText,
        ]);
    }
}