<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Pool;

Route::get('/', function () {
    return response()->json([
        'status' => 'online',
        'service' => 'Instagram High-Performance Media Downloader API',
        'version' => '5.1.0',
        'endpoints' => [
            'POST /api/download' => 'Ultra-fast parallel fetching for 100% MP4 Videos, Reels & Stories',
            'GET /api/proxy' => 'Proxy media stream bypassing Instagram CDN CORS'
        ]
    ])->header('Access-Control-Allow-Origin', '*')
      ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      ->header('Access-Control-Allow-Headers', '*');
});

// Options CORS Preflight Handlers
Route::options('/{any}', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-IG-App-ID');
})->where('any', '.*');

// ===== UTILITIES =====
function cleanInstagramUsernamePHP($input) {
    $raw = trim($input);
    if (empty($raw)) return '';
    if (str_contains($raw, '?')) {
        $raw = explode('?', $raw)[0];
    }
    $raw = preg_replace('/^https?:\/\/(?:www\.)?instagram\.com\//i', '', $raw);
    $raw = trim($raw, '/@ ');
    $parts = explode('/', $raw);
    foreach ($parts as $part) {
        $cleanPart = str_replace('@', '', trim($part));
        if (!empty($cleanPart) && !in_array(strtolower($cleanPart), ['reels', 'stories', 'reel', 'p', 'tv', 's'])) {
            return $cleanPart;
        }
    }
    return str_replace('@', '', $raw);
}

function getInstagramShortcodePHP($url) {
    if (empty($url)) return null;
    $clean = explode('?', $url)[0];
    if (preg_match('/(?:p|reel|reels|tv|stories\/[^\/]+|s\/[^\/]+)\/([A-Za-z0-9_:-]+)/i', $clean, $matches)) {
        return $matches[1];
    }
    return null;
}

// ===== ENGINE 1: NATIVE INSTAGRAM WEB PROFILE GRAPHQL ENGINE (FULL BROWSER SIGNATURE) =====
function fetchInstagramWebProfileReelsPHP($usernameInput, $limit = 12) {
    try {
        $cleanUsername = cleanInstagramUsernamePHP($usernameInput);
        if (empty($cleanUsername)) return null;

        $url = "https://www.instagram.com/api/v1/users/web_profile_info/?username={$cleanUsername}";
        $resp = Http::withoutVerifying()->timeout(10)->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Accept' => '*/*',
            'Accept-Language' => 'en-US,en;q=0.9',
            'X-IG-App-ID' => '936619743392459',
            'X-ASBD-ID' => '129477',
            'X-IG-WWW-Claim' => '0',
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'https://www.instagram.com',
            'Referer' => "https://www.instagram.com/{$cleanUsername}/"
        ])->get($url);

        if ($resp->successful()) {
            $data = $resp->json();
            $user = $data['data']['user'] ?? [];
            $edges = $user['edge_owner_to_timeline_media']['edges'] ?? [];

            $posts = [];
            foreach ($edges as $edge) {
                if (count($posts) >= $limit) break;
                $node = $edge['node'] ?? [];
                $isVideo = $node['is_video'] ?? false;
                $videoUrl = $node['video_url'] ?? null;
                $displayUrl = $node['display_url'] ?? null;
                $shortcode = $node['shortcode'] ?? '';

                if (!empty($node['edge_sidecar_to_children']['edges'])) {
                    foreach ($node['edge_sidecar_to_children']['edges'] as $cEdge) {
                        if (count($posts) >= $limit) break;
                        $cNode = $cEdge['node'] ?? [];
                        if (($cNode['is_video'] ?? false) && !empty($cNode['video_url'])) {
                            $posts[] = [
                                'id' => $cNode['shortcode'] ?? ($shortcode . '_' . ($cNode['id'] ?? uniqid())),
                                'url' => $cNode['video_url'],
                                'video_url' => $cNode['video_url'],
                                'type' => 'video',
                                'preview' => $cNode['display_url'] ?? $displayUrl
                            ];
                        }
                    }
                } else if ($isVideo && $videoUrl) {
                    $posts[] = [
                        'id' => $shortcode,
                        'url' => $videoUrl,
                        'video_url' => $videoUrl,
                        'type' => 'video',
                        'preview' => $displayUrl ?: $videoUrl
                    ];
                }
            }

            if (!empty($posts)) {
                return $posts;
            }
        }
    } catch (\Exception $e) {}
    return null;
}

// ===== ENGINE 2: COBALT MULTI-MEDIA API =====
function fetchCobaltInstagram($url) {
    try {
        $resp = Http::withoutVerifying()->timeout(8)->withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json'
        ])->post('https://api.cobalt.liubquanti.click/', ['url' => $url]);

        if ($resp->successful()) {
            $data = $resp->json();
            $media = [];
            if (($data['status'] ?? '') === 'redirect' && !empty($data['url'])) {
                $isVideo = str_contains($data['url'], '.mp4') || str_contains($data['url'], '/t50.') || str_contains($data['filename'] ?? '', '.mp4');
                if ($isVideo) {
                    $media[] = [
                        'url' => $data['url'],
                        'video_url' => $data['url'],
                        'type' => 'video'
                    ];
                }
            } else if (($data['status'] ?? '') === 'stream' && !empty($data['url'])) {
                $media[] = [
                    'url' => $data['url'],
                    'video_url' => $data['url'],
                    'type' => 'video'
                ];
            } else if (($data['status'] ?? '') === 'picker' && !empty($data['picker'])) {
                foreach ($data['picker'] as $item) {
                    if (!empty($item['url'])) {
                        $isVideo = ($item['type'] ?? '') === 'video' || str_contains($item['url'], '.mp4') || str_contains($item['url'], '/t50.');
                        if ($isVideo) {
                            $media[] = [
                                'url' => $item['url'],
                                'video_url' => $item['url'],
                                'type' => 'video'
                            ];
                        }
                    }
                }
            }

            if (!empty($media)) {
                return [
                    'success' => true,
                    'owner' => 'instagram_user',
                    'caption' => '',
                    'media_type' => 'video',
                    'media' => $media
                ];
            }
        }
    } catch (\Exception $e) {}
    return null;
}

// ===== MAIN API DOWNLOAD HANDLER =====
Route::post('/api/download', function (Request $request) {
    $data = json_decode($request->getContent(), true) ?: $request->all();
    $type = $data['type'] ?? $request->input('type') ?? 'single';
    $rawUrl = $data['url'] ?? $request->input('url') ?? '';
    $rawUsername = $data['username'] ?? $request->input('username') ?? '';
    $limit = intval($data['limit'] ?? $request->input('limit') ?? 12);

    $rawInput = $rawUrl ?: $rawUsername;
    if (empty($rawInput)) {
        return response()->json(['error' => 'Please provide a valid Instagram username or video link.'], 400)
            ->header('Access-Control-Allow-Origin', '*');
    }

    $cleanUsername = cleanInstagramUsernamePHP($rawInput);

    // 1. BULK PROFILE VIDEO REQUEST (100% MP4 VIDEOS & REELS)
    if ($type === 'bulk-fetch' || $type === 'bulk-video' || $type === 'bulk') {
        $webProfilePosts = fetchInstagramWebProfileReelsPHP($cleanUsername, $limit);
        if ($webProfilePosts && !empty($webProfilePosts)) {
            return response()->json(['posts' => $webProfilePosts])->header('Access-Control-Allow-Origin', '*');
        }

        // Fallback: Cobalt Reels
        $cobaltRes = fetchCobaltInstagram("https://www.instagram.com/{$cleanUsername}/reels/");
        if ($cobaltRes && !empty($cobaltRes['media'])) {
            $posts = array_map(function ($item, $idx) {
                return [
                    'id' => 'reel_' . $idx . '_' . time(),
                    'url' => $item['url'],
                    'video_url' => $item['url'],
                    'type' => 'video',
                    'preview' => $item['url']
                ];
            }, $cobaltRes['media'], array_keys($cobaltRes['media']));
            return response()->json(['posts' => $posts])->header('Access-Control-Allow-Origin', '*');
        }
    }

    // 2. STORIES REQUEST
    if ($type === 'stories') {
        $targetStoryUrl = "https://www.instagram.com/stories/{$cleanUsername}/";
        $cobaltStory = fetchCobaltInstagram($targetStoryUrl);
        if ($cobaltStory && !empty($cobaltStory['media'])) {
            $posts = array_map(function ($item, $idx) {
                return [
                    'id' => 'story_' . $idx . '_' . time(),
                    'url' => $item['url'],
                    'video_url' => $item['url'],
                    'type' => 'video',
                    'preview' => $item['url']
                ];
            }, $cobaltStory['media'], array_keys($cobaltStory['media']));
            return response()->json(['stories' => $posts])->header('Access-Control-Allow-Origin', '*');
        }
    }

    // 3. SINGLE REEL / VIDEO / POST REQUEST
    $singleUrl = str_starts_with($rawInput, 'http') ? $rawInput : "https://www.instagram.com/reel/{$cleanUsername}/";
    $cobaltRes = fetchCobaltInstagram($singleUrl);
    if ($cobaltRes) {
        return response()->json($cobaltRes)->header('Access-Control-Allow-Origin', '*');
    }

    return response()->json([
        'error' => 'Could not fetch Instagram video. Please verify the username or link is valid and public.'
    ], 422)->header('Access-Control-Allow-Origin', '*');
});

// API Proxy Handler - HIGH SPEED PROXY STREAMING
Route::get('/api/proxy', function (Request $request) {
    $targetUrl = $request->query('url');
    $format = strtolower($request->query('format', ''));

    if (!$targetUrl) {
        return response('Missing URL parameter', 400)->header('Access-Control-Allow-Origin', '*');
    }

    try {
        $response = Http::withoutVerifying()->timeout(10)->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Referer' => 'https://www.instagram.com/'
        ])->get($targetUrl);

        $headers = [
            'Access-Control-Allow-Origin' => '*',
            'Cache-Control' => 'public, max-age=86400'
        ];

        if ($format === 'mp3' || $format === 'audio') {
            $headers['Content-Type'] = 'audio/mpeg';
            $headers['Content-Disposition'] = 'attachment; filename="instagram_audio_' . time() . '.mp3"';
        } else {
            $headers['Content-Type'] = 'video/mp4';
            $headers['Content-Disposition'] = 'attachment; filename="instagram_video_' . time() . '.mp4"';
        }

        return response($response->body(), 200, $headers);
    } catch (\Exception $e) {
        return response('Proxy error: ' . $e->getMessage(), 500)->header('Access-Control-Allow-Origin', '*');
    }
});
