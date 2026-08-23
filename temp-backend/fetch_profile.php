<?php

function cleanUsernamePHP($raw) {
    $raw = trim($raw);
    if (str_contains($raw, '?')) $raw = explode('?', $raw)[0];
    $raw = preg_replace('#^https?://(?:www\.)?instagram\.com/#i', '', $raw);
    $raw = trim($raw, '/@');
    $parts = explode('/', $raw);
    foreach ($parts as $part) {
        $cleanPart = str_replace('@', '', trim($part));
        if (!empty($cleanPart) && !in_array(strtolower($cleanPart), ['reels', 'stories', 'reel', 'p', 'tv', 's'])) {
            return $cleanPart;
        }
    }
    return str_replace('@', '', $raw);
}

function fetchInstagramProfile($usernameInput, $limit = 12) {
    $cleanUsername = cleanUsernamePHP($usernameInput);
    if (empty($cleanUsername)) return [];

    $url = "https://www.instagram.com/api/v1/users/web_profile_info/?username={$cleanUsername}";
    $headers = [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'X-IG-App-ID: 936619743392459',
        'X-Requested-With: XMLHttpRequest',
        'X-ASBD-ID: 129477',
        'X-IG-WWW-Claim: 0',
        'Sec-Ch-Ua: "Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile: ?0',
        'Sec-Ch-Ua-Platform: "Windows"',
        'Sec-Fetch-Dest: empty',
        'Sec-Fetch-Mode: cors',
        'Sec-Fetch-Site: same-origin',
        'Accept: */*',
        'Accept-Language: en-US,en;q=0.9',
        "Referer: https://www.instagram.com/{$cleanUsername}/"
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code === 200 && !empty($res)) {
        $data = json_decode($res, true);
        $user = $data['data']['user'] ?? [];
        $timelineEdges = $user['edge_owner_to_timeline_media']['edges'] ?? [];
        $felixEdges = $user['edge_felix_video_timeline']['edges'] ?? [];
        $allEdges = array_merge($felixEdges, $timelineEdges);

        $posts = [];
        $seenIds = [];

        foreach ($allEdges as $edge) {
            if (count($posts) >= $limit) break;
            $node = $edge['node'] ?? [];
            $isVideo = $node['is_video'] ?? false;
            $videoUrl = $node['video_url'] ?? null;
            $displayUrl = $node['display_url'] ?? null;
            $shortcode = $node['shortcode'] ?? ($node['id'] ?? uniqid());

            if (!empty($node['edge_sidecar_to_children']['edges'])) {
                foreach ($node['edge_sidecar_to_children']['edges'] as $cEdge) {
                    if (count($posts) >= $limit) break;
                    $cNode = $cEdge['node'] ?? [];
                    $cId = $cNode['shortcode'] ?? ($shortcode . '_' . ($cNode['id'] ?? uniqid()));
                    if (($cNode['is_video'] ?? false) && !empty($cNode['video_url']) && !isset($seenIds[$cId])) {
                        $seenIds[$cId] = true;
                        $posts[] = [
                            'id' => $cId,
                            'url' => $cNode['video_url'],
                            'video_url' => $cNode['video_url'],
                            'type' => 'video',
                            'preview' => $cNode['display_url'] ?? $displayUrl
                        ];
                    }
                }
            } else if ($isVideo && $videoUrl && !isset($seenIds[$shortcode])) {
                $seenIds[$shortcode] = true;
                $posts[] = [
                    'id' => $shortcode,
                    'url' => $videoUrl,
                    'video_url' => $videoUrl,
                    'type' => 'video',
                    'preview' => $displayUrl ?: $videoUrl
                ];
            }
        }

        return $posts;
    }

    return [];
}

// When called via CLI
if (php_sapi_name() === 'cli') {
    $userArg = $argv[1] ?? '';
    $limitArg = intval($argv[2] ?? 12);
    $result = fetchInstagramProfile($userArg, $limitArg);
    echo json_encode($result);
}
