<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

Route::get('/', function () {
    return response()->json([
        'status' => 'online',
        'service' => 'Instagram High-Performance Media Downloader API',
        'version' => '6.0.0',
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

// Clean Username / URL Utility (Strips ?utm_source=..., @, domains)
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

// ===== ENGINE 1: NATIVE INSTAGRAM WEB PROFILE ENGINE =====
function fetchInstagramWebProfileReelsPHP($usernameInput, $limit = 12) {
    try {
        $cleanUsername = cleanInstagramUsernamePHP($usernameInput);
        if (empty($cleanUsername)) return null;

        $url = "https://www.instagram.com/api/v1/users/web_profile_info/?username={$cleanUsername}";
        
        $headers = [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'X-IG-App-ID' => '936619743392459',
            'X-Requested-With' => 'XMLHttpRequest',
            'X-ASBD-ID' => '129477',
            'X-IG-WWW-Claim' => '0',
            'Sec-Ch-Ua' => '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'Sec-Ch-Ua-Mobile' => '?0',
            'Sec-Ch-Ua-Platform' => '"Windows"',
            'Sec-Fetch-Dest' => 'empty',
            'Sec-Fetch-Mode' => 'cors',
            'Sec-Fetch-Site' => 'same-origin',
            'Accept' => '*/*',
            'Accept-Language' => 'en-US,en;q=0.9',
            'Referer' => "https://www.instagram.com/{$cleanUsername}/"
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
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

            if (!empty($posts)) {
                return $posts;
            }
        }
    } catch (\Exception $e) {}
    return null;
}

// ===== ENGINE 2: SNAPSAVE HIGH-SPEED UNPACKER =====
function decodeSnapSavePurePHP($htmlCode) {
    if (!preg_match('/\("([^"]+)",(\d+),"([^"]+)",(\d+),(\d+),(\d+)\)/', $htmlCode, $m)) {
        return null;
    }

    $h = $m[1];
    $u = intval($m[2]);
    $n = $m[3];
    $t = intval($m[4]);
    $e = intval($m[5]);

    $charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";

    $decodeBase = function($d, $fromBase) use ($charset) {
        $sourceChars = substr($charset, 0, $fromBase);
        $len = strlen($d);
        $val = 0;
        for ($k = 0; $k < $len; $k++) {
            $c = $d[$k];
            $pos = strpos($sourceChars, $c);
            if ($pos !== false) {
                $val = $val * $fromBase + $pos;
            }
        }
        return $val;
    };

    $r_str = "";
    $h_len = strlen($h);
    $delimiter = $n[$e];
    $i = 0;

    while ($i < $h_len) {
        $s = "";
        while ($i < $h_len && $h[$i] !== $delimiter) {
            $s .= $h[$i];
            $i++;
        }
        for ($j = 0; $j < strlen($n); $j++) {
            $s = str_replace($n[$j], strval($j), $s);
        }
        if (!empty($s)) {
            $decodedNum = $decodeBase($s, $e);
            $charCode = $decodedNum - $t;
            if ($charCode > 0) {
                $r_str .= chr($charCode);
            }
        }
        $i++;
    }

    return $r_str;
}

function fetchSnapSaveMediaPHP($url) {
    try {
        $ch = curl_init('https://snapsave.app/action.php');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['url' => $url]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Origin' => 'https://snapsave.app',
            'Referer' => 'https://snapsave.app/'
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        $res = curl_exec($ch);
        curl_close($ch);

        if (empty($res)) return null;

        $decoded = decodeSnapSavePurePHP($res);
        if (!$decoded) return null;

        $cleanHtml = stripslashes($decoded);
        $media = [];
        if (preg_match_all('/href="([^"]+)"/is', $cleanHtml, $matches)) {
            foreach ($matches[1] as $mUrl) {
                if (str_contains($mUrl, 'rapidcdn') || str_contains($mUrl, '.mp4') || str_contains($mUrl, 'cdninstagram') || str_contains($mUrl, 'fbcdn')) {
                    $isVideo = str_contains($mUrl, '.mp4') || str_contains($mUrl, 'snapsave-app') || str_contains($mUrl, 'token=') || str_contains($mUrl, 'video');
                    $media[] = [
                        'url' => $mUrl,
                        'video_url' => $mUrl,
                        'type' => $isVideo ? 'video' : 'photo',
                        'preview' => $mUrl
                    ];
                }
            }
        }

        if (!empty($media)) {
            return [
                'success' => true,
                'owner' => 'instagram_user',
                'caption' => '',
                'media_type' => count($media) > 1 ? 'carousel' : $media[0]['type'],
                'media' => $media
            ];
        }
    } catch (\Exception $e) {}
    return null;
}

// ===== ENGINE 3: COBALT MULTI-MEDIA API =====
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
                $media[] = [
                    'url' => $data['url'],
                    'video_url' => $data['url'],
                    'type' => $isVideo ? 'video' : 'photo',
                    'preview' => $data['url']
                ];
            } else if (($data['status'] ?? '') === 'stream' && !empty($data['url'])) {
                $media[] = [
                    'url' => $data['url'],
                    'video_url' => $data['url'],
                    'type' => 'video',
                    'preview' => $data['url']
                ];
            } else if (($data['status'] ?? '') === 'picker' && !empty($data['picker'])) {
                foreach ($data['picker'] as $item) {
                    if (!empty($item['url'])) {
                        $isVideo = ($item['type'] ?? '') === 'video' || str_contains($item['url'], '.mp4') || str_contains($item['url'], '/t50.');
                        $media[] = [
                            'url' => $item['url'],
                            'video_url' => $item['url'],
                            'type' => $isVideo ? 'video' : 'photo',
                            'preview' => $item['url']
                        ];
                    }
                }
            }

            if (!empty($media)) {
                return [
                    'success' => true,
                    'owner' => 'instagram_user',
                    'caption' => '',
                    'media_type' => count($media) > 1 ? 'carousel' : $media[0]['type'],
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

        // Fallback 1: SnapSave on reels page
        $snapSaveProfile = fetchSnapSaveMediaPHP("https://www.instagram.com/{$cleanUsername}/");
        if ($snapSaveProfile && !empty($snapSaveProfile['media'])) {
            $posts = array_map(function ($item, $idx) {
                return [
                    'id' => 'snap_' . $idx . '_' . time(),
                    'url' => $item['url'],
                    'video_url' => $item['url'],
                    'type' => $item['type'] ?? 'video',
                    'preview' => $item['preview'] ?? $item['url']
                ];
            }, $snapSaveProfile['media'], array_keys($snapSaveProfile['media']));
            return response()->json(['posts' => $posts])->header('Access-Control-Allow-Origin', '*');
        }

        // Fallback 2: Cobalt Reels
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
        $snapStory = fetchSnapSaveMediaPHP($targetStoryUrl);
        if ($snapStory && !empty($snapStory['media'])) {
            return response()->json(['stories' => $snapStory['media']])->header('Access-Control-Allow-Origin', '*');
        }

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
    
    // Engine A: SnapSave
    $snapRes = fetchSnapSaveMediaPHP($singleUrl);
    if ($snapRes && !empty($snapRes['media'])) {
        return response()->json($snapRes)->header('Access-Control-Allow-Origin', '*');
    }

    // Engine B: Web Profile single item
    $profileRes = fetchInstagramWebProfileReelsPHP($cleanUsername, 1);
    if ($profileRes && !empty($profileRes)) {
        return response()->json([
            'success' => true,
            'owner' => $cleanUsername,
            'caption' => '',
            'media_type' => 'video',
            'media' => $profileRes
        ])->header('Access-Control-Allow-Origin', '*');
    }

    // Engine C: Cobalt
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
        $response = Http::withoutVerifying()->timeout(15)->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
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
