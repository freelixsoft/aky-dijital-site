<?php

namespace App\Services;

use FacebookAds\Api;
use FacebookAds\Object\AdAccount;
use FacebookAds\Object\Campaign;
use FacebookAds\Object\AdSet;
use FacebookAds\Object\Fields\AdsInsightsFields;

class MetaAdsService
{
    public function fetchInsights(
        string $accessToken,
        string $adAccountId,
        string $datePreset = 'last_30d',
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): array {
        Api::init(null, null, $accessToken);

        $normalizedId = preg_replace('/^act_/', '', trim($adAccountId));
        $account = new AdAccount('act_' . $normalizedId);

        $fields = [
            AdsInsightsFields::CAMPAIGN_ID,
            AdsInsightsFields::CAMPAIGN_NAME,
            AdsInsightsFields::SPEND,
            AdsInsightsFields::IMPRESSIONS,
            AdsInsightsFields::CLICKS,
            AdsInsightsFields::CTR,
            AdsInsightsFields::CPC,
            AdsInsightsFields::CPM,
            AdsInsightsFields::ACTIONS,
            AdsInsightsFields::PURCHASE_ROAS,
        ];

        $params = ['level' => 'campaign'];
        $params = array_merge($params, $this->buildTimeParams($datePreset, $dateFrom, $dateTo));

        $insights = $account->getInsights($fields, $params);

        $data = [];
        foreach ($insights as $item) {
            $row = $item->exportAllData();
            $row['results_count'] = $this->extractResultsCount($row['actions'] ?? []);
            $row['roas_value'] = $this->extractRoasValue($row['purchase_roas'] ?? []);
            $data[] = $row;
        }

        return $data;
    }

    public function fetchCampaignDetail(
        string $accessToken,
        string $campaignId,
        string $datePreset = 'last_30d',
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): ?array {
        Api::init(null, null, $accessToken);

        $campaign = new Campaign($campaignId);

        $fields = [
            AdsInsightsFields::CAMPAIGN_ID,
            AdsInsightsFields::CAMPAIGN_NAME,
            AdsInsightsFields::SPEND,
            AdsInsightsFields::IMPRESSIONS,
            AdsInsightsFields::CLICKS,
            AdsInsightsFields::CTR,
            AdsInsightsFields::CPC,
            AdsInsightsFields::CPM,
            AdsInsightsFields::ACTIONS,
            AdsInsightsFields::PURCHASE_ROAS,
        ];

        $params = $this->buildTimeParams($datePreset, $dateFrom, $dateTo);
        $insights = $campaign->getInsights($fields, $params);

        foreach ($insights as $item) {
            $row = $item->exportAllData();
            $row['results_count'] = $this->extractResultsCount($row['actions'] ?? []);
            $row['roas_value'] = $this->extractRoasValue($row['purchase_roas'] ?? []);
            return $row;
        }

        return null;
    }

    public function fetchAdSetsByCampaign(
        string $accessToken,
        string $campaignId,
        string $datePreset = 'last_30d',
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): array {
        Api::init(null, null, $accessToken);

        $campaign = new Campaign($campaignId);

        $fields = [
            AdsInsightsFields::ADSET_ID,
            AdsInsightsFields::ADSET_NAME,
            AdsInsightsFields::SPEND,
            AdsInsightsFields::IMPRESSIONS,
            AdsInsightsFields::CLICKS,
            AdsInsightsFields::CTR,
            AdsInsightsFields::CPC,
            AdsInsightsFields::CPM,
            AdsInsightsFields::ACTIONS,
            AdsInsightsFields::PURCHASE_ROAS,
        ];

        $params = $this->buildTimeParams($datePreset, $dateFrom, $dateTo);
        $params['level'] = 'adset';

        $insights = $campaign->getInsights($fields, $params);

        $data = [];
        foreach ($insights as $item) {
            $row = $item->exportAllData();
            $row['results_count'] = $this->extractResultsCount($row['actions'] ?? []);
            $row['roas_value'] = $this->extractRoasValue($row['purchase_roas'] ?? []);
            $data[] = $row;
        }

        return $data;
    }

    public function fetchAdSetDetail(
        string $accessToken,
        string $adSetId,
        string $datePreset = 'last_30d',
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): ?array {
        Api::init(null, null, $accessToken);

        $adSet = new AdSet($adSetId);

        $fields = [
            AdsInsightsFields::ADSET_ID,
            AdsInsightsFields::ADSET_NAME,
            AdsInsightsFields::SPEND,
            AdsInsightsFields::IMPRESSIONS,
            AdsInsightsFields::CLICKS,
            AdsInsightsFields::CTR,
            AdsInsightsFields::CPC,
            AdsInsightsFields::CPM,
            AdsInsightsFields::ACTIONS,
            AdsInsightsFields::PURCHASE_ROAS,
        ];

        $params = $this->buildTimeParams($datePreset, $dateFrom, $dateTo);
        $insights = $adSet->getInsights($fields, $params);

        foreach ($insights as $item) {
            $row = $item->exportAllData();
            $row['results_count'] = $this->extractResultsCount($row['actions'] ?? []);
            $row['roas_value'] = $this->extractRoasValue($row['purchase_roas'] ?? []);
            return $row;
        }

        return null;
    }

    public function fetchAdsByAdSet(
        string $accessToken,
        string $adSetId,
        string $datePreset = 'last_30d',
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): array {
        Api::init(null, null, $accessToken);

        $adSet = new AdSet($adSetId);

        $fields = [
            AdsInsightsFields::AD_ID,
            AdsInsightsFields::AD_NAME,
            AdsInsightsFields::SPEND,
            AdsInsightsFields::IMPRESSIONS,
            AdsInsightsFields::CLICKS,
            AdsInsightsFields::CTR,
            AdsInsightsFields::CPC,
            AdsInsightsFields::CPM,
            AdsInsightsFields::ACTIONS,
            AdsInsightsFields::PURCHASE_ROAS,
        ];

        $params = $this->buildTimeParams($datePreset, $dateFrom, $dateTo);
        $params['level'] = 'ad';

        $insights = $adSet->getInsights($fields, $params);

        $data = [];
        foreach ($insights as $item) {
            $row = $item->exportAllData();
            $row['results_count'] = $this->extractResultsCount($row['actions'] ?? []);
            $row['roas_value'] = $this->extractRoasValue($row['purchase_roas'] ?? []);
            $data[] = $row;
        }

        return $data;
    }

    public function getAdSetMeta(string $accessToken, string $adSetId): array
    {
        return $this->graphGet(
            $accessToken,
            $adSetId,
            ['fields' => 'id,name,daily_budget,status'],
            'Ad set meta hatasi'
        );
    }

    public function createCampaign(
        string $accessToken,
        string $adAccountId,
        string $name,
        string $objective,
        string $status = 'PAUSED'
    ): array {
        $normalizedId = preg_replace('/^act_/', '', trim($adAccountId));

        $payload = [
            'name' => $name,
            'objective' => $objective,
            'status' => $status,
            'special_ad_categories' => '[]',
            'is_adset_budget_sharing_enabled' => 'false',
        ];

        return $this->graphPost(
            $accessToken,
            'act_' . $normalizedId . '/campaigns',
            $payload,
            'Campaign create hatası'
        );
    }

    public function createAdSet(
        string $accessToken,
        string $adAccountId,
        array $data
    ): array {
        $normalizedId = preg_replace('/^act_/', '', trim($adAccountId));

        $payload = [
            'name' => (string)$data['name'],
            'campaign_id' => (string)$data['campaign_id'],
            'daily_budget' => (string)$data['daily_budget'],
            'billing_event' => (string)($data['billing_event'] ?? 'IMPRESSIONS'),
            'optimization_goal' => (string)$data['optimization_goal'],
            'bid_strategy' => (string)($data['bid_strategy'] ?? 'LOWEST_COST_WITHOUT_CAP'),
            'status' => (string)($data['status'] ?? 'PAUSED'),
            'is_adset_budget_sharing_enabled' => !empty($data['is_adset_budget_sharing_enabled']) ? 'true' : 'false',
            'targeting' => json_encode($data['targeting'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'start_time' => (string)$data['start_time'],
        ];

        if (!empty($data['promoted_object'])) {
            $payload['promoted_object'] = json_encode(
                $data['promoted_object'],
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            );
        }

        if (!empty($data['end_time'])) {
            $payload['end_time'] = (string)$data['end_time'];
        }

        if (!empty($data['attribution_spec'])) {
            $payload['attribution_spec'] = json_encode(
                $data['attribution_spec'],
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            );
        }

        return $this->graphPost(
            $accessToken,
            'act_' . $normalizedId . '/adsets',
            $payload,
            'Ad set create hatası'
        );
    }

    public function uploadAdImage(
        string $accessToken,
        string $adAccountId,
        string $imagePath
    ): array {
        $normalizedId = preg_replace('/^act_/', '', trim($adAccountId));

        if (!is_file($imagePath)) {
            throw new \RuntimeException('Gorsel dosyasi bulunamadi: ' . $imagePath);
        }

        $payload = [
            'filename' => new \CURLFile($imagePath),
        ];

        return $this->graphMultipartPost(
            $accessToken,
            'act_' . $normalizedId . '/adimages',
            $payload,
            'Ad image upload hatasi'
        );
    }

    public function createAdCreative(
        string $accessToken,
        string $adAccountId,
        array $data
    ): array {
        $normalizedId = preg_replace('/^act_/', '', trim($adAccountId));

        $objectStorySpec = [
            'page_id' => (string)$data['page_id'],
            'link_data' => [
                'message' => (string)($data['primary_text'] ?? ''),
                'link' => (string)$data['destination_url'],
                'name' => (string)($data['headline'] ?? ''),
                'description' => (string)($data['description'] ?? ''),
                'call_to_action' => [
                    'type' => (string)($data['cta_type'] ?? 'LEARN_MORE'),
                    'value' => [
                        'link' => (string)$data['destination_url'],
                    ],
                ],
                'image_hash' => (string)$data['image_hash'],
            ],
        ];

        $payload = [
            'name' => (string)$data['name'],
            'object_story_spec' => json_encode(
                $objectStorySpec,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            ),
        ];

        return $this->graphPost(
            $accessToken,
            'act_' . $normalizedId . '/adcreatives',
            $payload,
            'Ad creative create hatası'
        );
    }

    public function createAd(
        string $accessToken,
        string $adAccountId,
        array $data
    ): array {
        $normalizedId = preg_replace('/^act_/', '', trim($adAccountId));

        $payload = [
            'name' => (string)$data['name'],
            'adset_id' => (string)$data['adset_id'],
            'creative' => json_encode(
                ['creative_id' => (string)$data['creative_id']],
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            ),
            'status' => (string)($data['status'] ?? 'PAUSED'),
        ];

        return $this->graphPost(
            $accessToken,
            'act_' . $normalizedId . '/ads',
            $payload,
            'Ad create hatası'
        );
    }

    public function updateCampaignStatus(
        string $accessToken,
        string $campaignId,
        string $status
    ): array {
        return $this->graphPost(
            $accessToken,
            $campaignId,
            ['status' => $status],
            'Campaign status update hatasi'
        );
    }

    public function updateAdStatus(
        string $accessToken,
        string $adId,
        string $status
    ): array {
        return $this->graphPost(
            $accessToken,
            $adId,
            ['status' => $status],
            'Ad status update hatasi'
        );
    }

    public function updateAdSetBudget(
        string $accessToken,
        string $adSetId,
        string $dailyBudget
    ): array {
        return $this->graphPost(
            $accessToken,
            $adSetId,
            ['daily_budget' => $dailyBudget],
            'Ad set budget update hatasi'
        );
    }

    public function duplicateAd(
        string $accessToken,
        string $adId,
        string $newName
    ): array {
        return $this->graphPost(
            $accessToken,
            $adId . '/copies',
            [
                'rename_options' => json_encode([
                    'rename_strategy' => 'ONLY_TOP_LEVEL_RENAME',
                    'rename_suffix' => ' Copy ' . date('YmdHis'),
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'deep_copy' => 'true',
            ],
            'Ad duplicate hatasi'
        );
    }

    public function getPreviousPeriod(string $datePreset, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $today = new \DateTimeImmutable('today');

        switch ($datePreset) {
            case 'today':
                return ['date_preset' => 'yesterday', 'date_from' => null, 'date_to' => null];
            case 'yesterday':
                return [
                    'date_preset' => 'custom',
                    'date_from' => $today->modify('-2 day')->format('Y-m-d'),
                    'date_to' => $today->modify('-2 day')->format('Y-m-d'),
                ];
            case 'last_7d':
                return [
                    'date_preset' => 'custom',
                    'date_from' => $today->modify('-14 day')->format('Y-m-d'),
                    'date_to' => $today->modify('-8 day')->format('Y-m-d'),
                ];
            case 'last_14d':
                return [
                    'date_preset' => 'custom',
                    'date_from' => $today->modify('-28 day')->format('Y-m-d'),
                    'date_to' => $today->modify('-15 day')->format('Y-m-d'),
                ];
            case 'last_30d':
                return [
                    'date_preset' => 'custom',
                    'date_from' => $today->modify('-60 day')->format('Y-m-d'),
                    'date_to' => $today->modify('-31 day')->format('Y-m-d'),
                ];
            case 'this_month':
                $firstDayThisMonth = $today->modify('first day of this month');
                $firstDayLastMonth = $firstDayThisMonth->modify('-1 month');
                $lastDayLastMonth = $firstDayThisMonth->modify('-1 day');
                return [
                    'date_preset' => 'custom',
                    'date_from' => $firstDayLastMonth->format('Y-m-d'),
                    'date_to' => $lastDayLastMonth->format('Y-m-d'),
                ];
            case 'last_month':
                $firstDayThisMonth = $today->modify('first day of this month');
                $firstDayLastMonth = $firstDayThisMonth->modify('-1 month');
                $firstDayTwoMonthsAgo = $firstDayLastMonth->modify('-1 month');
                $lastDayTwoMonthsAgo = $firstDayLastMonth->modify('-1 day');
                return [
                    'date_preset' => 'custom',
                    'date_from' => $firstDayTwoMonthsAgo->format('Y-m-d'),
                    'date_to' => $lastDayTwoMonthsAgo->format('Y-m-d'),
                ];
        }

        if ($datePreset === 'custom' && $dateFrom && $dateTo) {
            $start = new \DateTimeImmutable($dateFrom);
            $end = new \DateTimeImmutable($dateTo);
            $days = (int)$start->diff($end)->days + 1;
            $prevEnd = $start->modify('-1 day');
            $prevStart = $prevEnd->modify('-' . ($days - 1) . ' day');

            return [
                'date_preset' => 'custom',
                'date_from' => $prevStart->format('Y-m-d'),
                'date_to' => $prevEnd->format('Y-m-d'),
            ];
        }

        return ['date_preset' => 'last_30d', 'date_from' => null, 'date_to' => null];
    }

    public function summarizeInsights(array $campaignData): array
    {
        $totalSpend = 0;
        $totalImpressions = 0;
        $totalClicks = 0;
        $totalResults = 0;
        $totalRoas = 0;
        $avgCtr = 0;
        $avgRoas = 0;

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

        return [
            'spend' => $totalSpend,
            'impressions' => $totalImpressions,
            'clicks' => $totalClicks,
            'results' => $totalResults,
            'ctr' => $avgCtr,
            'roas' => $avgRoas,
        ];
    }

    public function calculateTrend(float $current, float $previous): array
    {
        if ($previous == 0.0) {
            return [
                'percent' => $current > 0 ? 100 : 0,
                'direction' => $current > 0 ? 'up' : 'flat',
            ];
        }

        $percent = (($current - $previous) / $previous) * 100;

        return [
            'percent' => $percent,
            'direction' => $percent > 0 ? 'up' : ($percent < 0 ? 'down' : 'flat'),
        ];
    }

    private function buildTimeParams(
        string $datePreset,
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): array {
        if ($datePreset === 'custom' && $dateFrom && $dateTo) {
            return [
                'time_range' => [
                    'since' => $dateFrom,
                    'until' => $dateTo,
                ],
            ];
        }

        return ['date_preset' => $datePreset];
    }

    private function extractResultsCount(array $actions): float
    {
        $priorityActions = [
            'purchase',
            'omni_purchase',
            'offsite_conversion.fb_pixel_purchase',
            'onsite_conversion.purchase',
            'lead',
            'onsite_conversion.lead_grouped',
            'offsite_conversion.fb_pixel_lead',
            'complete_registration',
            'offsite_conversion.fb_pixel_complete_registration',
        ];

        foreach ($priorityActions as $targetType) {
            foreach ($actions as $action) {
                if (($action['action_type'] ?? '') === $targetType) {
                    return (float)($action['value'] ?? 0);
                }
            }
        }

        return 0;
    }

    private function extractRoasValue(array $purchaseRoas): float
    {
        foreach ($purchaseRoas as $item) {
            if (isset($item['value'])) {
                return (float)$item['value'];
            }
        }

        return 0;
    }

    private function graphGet(string $accessToken, string $endpoint, array $params = [], string $label = 'Meta API hatasi'): array
    {
        $url = 'https://graph.facebook.com/v23.0/' . ltrim($endpoint, '/');
        $params['access_token'] = $accessToken;
        $url .= '?' . http_build_query($params);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
        ]);

        $result = curl_exec($ch);

        if ($result === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new \RuntimeException($label . ': Meta bağlantı hatası: ' . $error);
        }

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($result, true);

        if ($httpCode >= 400 || isset($data['error'])) {
            $message = $data['error']['message'] ?? 'Bilinmeyen Meta API hatası';
            throw new \RuntimeException($label . ': ' . $message);
        }

        return is_array($data) ? $data : [];
    }

    private function graphPost(string $accessToken, string $endpoint, array $payload, string $label = 'Meta API hatası'): array
    {
        $url = 'https://graph.facebook.com/v23.0/' . ltrim($endpoint, '/');
        $payload['access_token'] = $accessToken;

        $postFields = [];
        foreach ($payload as $key => $value) {
            if ($value === null) {
                continue;
            }
            $postFields[$key] = (string)$value;
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($postFields),
            CURLOPT_TIMEOUT => 60,
        ]);

        $result = curl_exec($ch);

        if ($result === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new \RuntimeException($label . ': Meta bağlantı hatası: ' . $error);
        }

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($result, true);

        if ($httpCode >= 400 || isset($data['error'])) {
            $errorMessage = $data['error']['message'] ?? 'Bilinmeyen Meta API hatası';
            $errorCode = $data['error']['code'] ?? '';
            $errorSubcode = $data['error']['error_subcode'] ?? '';
            $errorType = $data['error']['type'] ?? '';
            $fbTraceId = $data['error']['fbtrace_id'] ?? '';
            $errorUserTitle = $data['error']['error_user_title'] ?? '';
            $errorUserMsg = $data['error']['error_user_msg'] ?? '';

            $fullMessage = $label . ': ' . $errorMessage;

            if ($errorUserTitle !== '') {
                $fullMessage .= ' | user_title: ' . $errorUserTitle;
            }
            if ($errorUserMsg !== '') {
                $fullMessage .= ' | user_msg: ' . $errorUserMsg;
            }
            if ($errorType !== '') {
                $fullMessage .= ' | type: ' . $errorType;
            }
            if ($errorCode !== '') {
                $fullMessage .= ' | code: ' . $errorCode;
            }
            if ($errorSubcode !== '') {
                $fullMessage .= ' | subcode: ' . $errorSubcode;
            }
            if ($fbTraceId !== '') {
                $fullMessage .= ' | fbtrace_id: ' . $fbTraceId;
            }

            $fullMessage .= ' | payload: ' . json_encode($postFields, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            throw new \RuntimeException($fullMessage);
        }

        return $data;
    }

    private function graphMultipartPost(string $accessToken, string $endpoint, array $payload, string $label = 'Meta API hatasi'): array
    {
        $url = 'https://graph.facebook.com/v23.0/' . ltrim($endpoint, '/');
        $payload['access_token'] = $accessToken;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_TIMEOUT => 120,
        ]);

        $result = curl_exec($ch);

        if ($result === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new \RuntimeException($label . ': Meta baglanti hatasi: ' . $error);
        }

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($result, true);

        if ($httpCode >= 400 || isset($data['error'])) {
            $errorMessage = $data['error']['message'] ?? 'Bilinmeyen Meta API hatasi';
            $errorCode = $data['error']['code'] ?? '';
            $errorSubcode = $data['error']['error_subcode'] ?? '';
            $errorType = $data['error']['type'] ?? '';
            $fbTraceId = $data['error']['fbtrace_id'] ?? '';
            $errorUserTitle = $data['error']['error_user_title'] ?? '';
            $errorUserMsg = $data['error']['error_user_msg'] ?? '';

            $fullMessage = $label . ': ' . $errorMessage;

            if ($errorUserTitle !== '') {
                $fullMessage .= ' | user_title: ' . $errorUserTitle;
            }
            if ($errorUserMsg !== '') {
                $fullMessage .= ' | user_msg: ' . $errorUserMsg;
            }
            if ($errorType !== '') {
                $fullMessage .= ' | type: ' . $errorType;
            }
            if ($errorCode !== '') {
                $fullMessage .= ' | code: ' . $errorCode;
            }
            if ($errorSubcode !== '') {
                $fullMessage .= ' | subcode: ' . $errorSubcode;
            }
            if ($fbTraceId !== '') {
                $fullMessage .= ' | fbtrace_id: ' . $fbTraceId;
            }

            throw new \RuntimeException($fullMessage);
        }

        return $data;
    }
}