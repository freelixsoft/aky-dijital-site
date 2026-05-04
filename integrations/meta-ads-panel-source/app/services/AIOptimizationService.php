<?php

namespace App\Services;

class AIOptimizationService
{
    public function buildCampaignActions(array $campaignData): array
    {
        $actions = [];

        foreach ($campaignData as $campaign) {
            $campaignId = (string)($campaign['campaign_id'] ?? '');
            $campaignName = (string)($campaign['campaign_name'] ?? '-');
            $spend = (float)($campaign['spend'] ?? 0);
            $ctr = (float)($campaign['ctr'] ?? 0);
            $cpc = (float)($campaign['cpc'] ?? 0);
            $results = (float)($campaign['results_count'] ?? 0);
            $roas = (float)($campaign['roas_value'] ?? 0);

            if ($campaignId === '') {
                continue;
            }

            if ($spend > 0 && $results <= 0 && $ctr > 0 && $ctr < 1) {
                $actions[] = [
                    'type' => 'pause_campaign',
                    'entity_id' => $campaignId,
                    'entity_name' => $campaignName,
                    'reason' => 'Harcama var, sonuç yok ve CTR düşük.',
                    'impact' => 'Kampanyayı durdur',
                ];
            }

            if ($roas >= 3) {
                $actions[] = [
                    'type' => 'scale_campaign_note',
                    'entity_id' => $campaignId,
                    'entity_name' => $campaignName,
                    'reason' => 'ROAS güçlü görünüyor.',
                    'impact' => 'Ölçekleme adayı',
                ];
            }

            if ($cpc > 20) {
                $actions[] = [
                    'type' => 'review_campaign',
                    'entity_id' => $campaignId,
                    'entity_name' => $campaignName,
                    'reason' => 'CPC yüksek.',
                    'impact' => 'Kreatif/metin gözden geçirilmeli',
                ];
            }
        }

        return $actions;
    }

    public function buildDeepOptimizationPlan(array $campaigns, callable $adSetFetcher, callable $adFetcher, callable $adSetMetaFetcher): array
    {
        $plan = [
            'campaigns' => [],
            'adsets' => [],
            'ads' => [],
        ];

        foreach ($campaigns as $campaign) {
            $campaignId = (string)($campaign['campaign_id'] ?? '');
            $campaignName = (string)($campaign['campaign_name'] ?? '-');

            if ($campaignId === '') {
                continue;
            }

            $adSets = $adSetFetcher($campaignId);

            foreach ($adSets as $adSet) {
                $adSetId = (string)($adSet['adset_id'] ?? '');
                $adSetName = (string)($adSet['adset_name'] ?? '-');
                $adSetSpend = (float)($adSet['spend'] ?? 0);
                $adSetCpc = (float)($adSet['cpc'] ?? 0);
                $adSetResults = (float)($adSet['results_count'] ?? 0);

                if ($adSetId === '') {
                    continue;
                }

                $adSetMeta = $adSetMetaFetcher($adSetId);
                $currentBudget = (int)($adSetMeta['daily_budget'] ?? 0);

                if ($adSetSpend > 0 && $adSetCpc > 20 && $adSetResults <= 1 && $currentBudget > 0) {
                    $plan['adsets'][] = [
                        'type' => 'reduce_adset_budget',
                        'entity_id' => $adSetId,
                        'entity_name' => $adSetName,
                        'campaign_name' => $campaignName,
                        'reason' => 'Ad set pahalı çalışıyor, CPC yüksek ve sonuç zayıf.',
                        'impact' => 'Bütçe düşür',
                        'current_budget' => $currentBudget,
                        'suggested_budget_multiplier' => 0.80,
                    ];
                }

                $ads = $adFetcher($adSetId);

                foreach ($ads as $ad) {
                    $adId = (string)($ad['ad_id'] ?? '');
                    $adName = (string)($ad['ad_name'] ?? '-');
                    $spend = (float)($ad['spend'] ?? 0);
                    $ctr = (float)($ad['ctr'] ?? 0);
                    $cpc = (float)($ad['cpc'] ?? 0);
                    $results = (float)($ad['results_count'] ?? 0);
                    $roas = (float)($ad['roas_value'] ?? 0);
                    $clicks = (int)($ad['clicks'] ?? 0);

                    if ($adId === '') {
                        continue;
                    }

                    if ($spend > 0 && $results <= 0 && $ctr > 0 && $ctr < 1) {
                        $plan['ads'][] = [
                            'type' => 'pause_ad',
                            'entity_id' => $adId,
                            'entity_name' => $adName,
                            'campaign_name' => $campaignName,
                            'adset_name' => $adSetName,
                            'reason' => 'Harcama var, sonuç yok ve CTR düşük.',
                            'impact' => 'Reklamı durdur',
                        ];
                    }

                    if ($roas >= 3 && $results > 0) {
                        $plan['ads'][] = [
                            'type' => 'duplicate_ad_note',
                            'entity_id' => $adId,
                            'entity_name' => $adName,
                            'campaign_name' => $campaignName,
                            'adset_name' => $adSetName,
                            'reason' => 'ROAS güçlü, ölçekleme için uygun. Şimdilik otomatik duplicate yerine manuel/fresh duplicate önerilir.',
                            'impact' => 'Ölçekleme adayı',
                        ];
                    }

                    if ($ctr < 1.2 && $clicks >= 5 && $cpc > 10) {
                        $plan['ads'][] = [
                            'type' => 'refresh_copy_note',
                            'entity_id' => $adId,
                            'entity_name' => $adName,
                            'campaign_name' => $campaignName,
                            'adset_name' => $adSetName,
                            'reason' => 'Tıklama var ama ilgi zayıf, metin veya kreatif yenilenmeli.',
                            'impact' => 'Metin/kreatif yenile',
                        ];
                    }
                }
            }
        }

        return $plan;
    }

    public function summarizeActions(array $actions): array
    {
        $summary = [
            'pause_campaign' => 0,
            'scale_campaign_note' => 0,
            'review_campaign' => 0,
        ];

        foreach ($actions as $action) {
            $type = $action['type'] ?? '';
            if (isset($summary[$type])) {
                $summary[$type]++;
            }
        }

        return $summary;
    }

    public function summarizeDeepPlan(array $plan): array
    {
        $summary = [
            'pause_ad' => 0,
            'duplicate_ad_note' => 0,
            'reduce_adset_budget' => 0,
            'refresh_copy_note' => 0,
        ];

        foreach ($plan['adsets'] ?? [] as $action) {
            $type = $action['type'] ?? '';
            if (isset($summary[$type])) {
                $summary[$type]++;
            }
        }

        foreach ($plan['ads'] ?? [] as $action) {
            $type = $action['type'] ?? '';
            if (isset($summary[$type])) {
                $summary[$type]++;
            }
        }

        return $summary;
    }
}