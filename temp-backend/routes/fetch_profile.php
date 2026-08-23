<?php
require_once __DIR__ . '/web.php';
$username = $argv[1] ?? 'madinastoriesofficial';
$limit = intval($argv[2] ?? 12);
$posts = fetchInstagramWebProfileReelsPHP($username, $limit);
echo json_encode($posts ?: []);
