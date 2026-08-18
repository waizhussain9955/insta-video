<?php

$payload = json_encode([
    'type' => 'bulk-video',
    'username' => 'design_with_tirth',
    'url' => 'https://www.instagram.com/design_with_tirth/?utm_source=ig_web_button_share_sheet',
    'limit' => 12
]);

$ch = curl_init('https://api.thecalicocats.com/api/download');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);

$res = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode | Error: $err\n";
echo "Response Len: " . strlen($res) . "\n";
echo "Response Body:\n" . substr($res, 0, 1500) . "\n";
