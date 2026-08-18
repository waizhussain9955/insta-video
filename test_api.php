<?php

$payload = json_encode([
    'type' => 'bulk-video',
    'username' => 'design_with_tirth',
    'url' => 'design_with_tirth',
    'limit' => 12
]);

$ch = curl_init('https://api.thecalicocats.com/api/download');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "api.thecalicocats.com Code: $httpCode\n";
echo "Response: " . substr($response, 0, 500) . "\n";
