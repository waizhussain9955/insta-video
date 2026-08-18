<?php

$username = 'design_with_tirth';

echo "1. Testing web_profile_info for $username ...\n";
$ch = curl_init("https://www.instagram.com/api/v1/users/web_profile_info/?username={$username}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'X-IG-App-ID: 936619743392459',
    'X-Requested-With: XMLHttpRequest',
    'Referer: https://www.instagram.com/' . $username . '/'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$igRes = curl_exec($ch);
$igCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "IG Code: $igCode | Len: " . strlen($igRes) . "\n";
if ($igCode == 200) {
    $data = json_decode($igRes, true);
    $edges = $data['data']['user']['edge_owner_to_timeline_media']['edges'] ?? [];
    echo "Timeline media count: " . count($edges) . "\n";
    $videoCount = 0;
    foreach ($edges as $edge) {
        $node = $edge['node'];
        $isVideo = $node['is_video'] ?? false;
        $videoUrl = $node['video_url'] ?? null;
        if ($isVideo) $videoCount++;
        echo "Post {$node['shortcode']} | isVideo: " . ($isVideo ? 'YES' : 'NO') . " | VideoUrl: " . ($videoUrl ? 'YES' : 'NO') . "\n";
    }
    echo "Total videos found: $videoCount\n";
} else {
    echo "Response: " . substr($igRes, 0, 300) . "\n";
}
