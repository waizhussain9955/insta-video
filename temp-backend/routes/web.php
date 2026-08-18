<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Pool;

Route::get('/', function () {
    return response()->json([
        'status' => 'online',
        'service' => 'Instagram Media Downloader API',
        'version' => '2.0.0',
        'endpoints' => [
            'POST /api/download' => 'Ultra-fast parallel fetching for Reels, Videos, Stories, Photos & Bulk',
            'GET /api/proxy' => 'Proxy media stream bypassing Instagram CDN CORS'
        ]
    ]);
});

// Options CORS Handlers
Route::options('/{any}', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
})->where('any', '.*');

// Extract Shortcode from Instagram Link
function getInstagramShortcode($url) {
    if (empty($url)) return null;
    if (preg_match('/(?:p|reel|reels|tv|stories\/[^\/]+|s\/[^\/]+)\/([A-Za-z0-9_:-]+)/', $url, $matches)) {
        return $matches[1];
    }
    return null;
}

// Get Instagram CSRF Token
function getInstagramCSRF() {
    try {
        $response = Http::timeout(6)->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ])->get('https://www.instagram.com/');

        $cookies = $response->headers()['set-cookie'] ?? [];
        foreach ($cookies as $cookie) {
            if (str_contains($cookie, 'csrftoken=')) {
                $parts = explode('csrftoken=', $cookie);
                return explode(';', $parts[1])[0];
            }
        }
    } catch (\Exception $e) {}
    return 'missing_csrf';
}

// ===== ENGINE 1: COBALT MULTI-MEDIA API =====
function fetchCobaltInstagram($url) {
    try {
        $resp = Http::timeout(8)->withHeaders([
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
                    'video_url' => $isVideo ? $data['url'] : null,
                    'image_url' => !$isVideo ? $data['url'] : null,
                    'type' => $isVideo ? 'video' : 'image'
                ];
            } else if (($data['status'] ?? '') === 'stream' && !empty($data['url'])) {
                $media[] = [
                    'url' => $data['url'],
                    'video_url' => $data['url'],
                    'image_url' => null,
                    'type' => 'video'
                ];
            } else if (($data['status'] ?? '') === 'picker' && !empty($data['picker'])) {
                foreach ($data['picker'] as $item) {
                    if (!empty($item['url'])) {
                        $isVideo = ($item['type'] ?? '') === 'video' || str_contains($item['url'], '.mp4') || str_contains($item['url'], '/t50.');
                        $media[] = [
                            'url' => $item['url'],
                            'video_url' => $isVideo ? $item['url'] : null,
                            'image_url' => !$isVideo ? $item['url'] : null,
                            'type' => $isVideo ? 'video' : 'image'
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

// ===== ENGINE 2: SNAPSAVE DEOBFUSCATOR =====
function convertBasePHP($d, $e, $f) {
    $g = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
    $h = substr($g, 0, $e);
    $i = substr($g, 0, $f);
    $j = 0;
    $len = strlen($d);
    for ($c = 0; $c < $len; $c++) {
        $b = $d[$len - 1 - $c];
        $index = strpos($h, $b);
        if ($index !== false) {
            $j += $index * pow($e, $c);
        }
    }
    $k = "";
    $temp = $j;
    while ($temp > 0) {
        $k = $i[$temp % $f] . $k;
        $temp = floor($temp / $f);
    }
    return $k ?: "0";
}

function deobfuscateSnapSavePHP($h, $n, $t, $e) {
    $r = "";
    $i = 0;
    $len = strlen($h);
    while ($i < $len) {
        $s = "";
        while ($i < $len && $h[$i] !== $n[$e]) {
            $s .= $h[$i];
            $i++;
        }
        $sMapped = "";
        for ($c = 0; $c < strlen($s); $c++) {
            $sMapped .= strpos($n, $s[$c]);
        }
        $val = intval(convertBasePHP($sMapped, $e, 10)) - $t;
        $r .= chr($val);
        $i++;
    }
    return $r;
}

function fetchSnapSaveMediaPHP($targetUrl) {
    try {
        $snapResp = Http::timeout(8)->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer' => 'https://snapsave.app/',
            'Origin' => 'https://snapsave.app',
            'Content-Type' => 'application/x-www-form-urlencoded'
        ])->asForm()->post('https://snapsave.app/action.php', ['url' => $targetUrl]);

        if ($snapResp->successful()) {
            $html = $snapResp->body();
            
            if (preg_match('/\(["\'](\w+)["\'],\s*\d+,\s*["\'](\w+)["\'],\s*(\d+),\s*(\d+),\s*\d+\)/', $html, $matches)) {
                $encoded = $matches[1];
                $charset = $matches[2];
                $shift = intval($matches[3]);
                $radix = intval($matches[4]);

                $decoded = deobfuscateSnapSavePHP($encoded, $charset, $shift, $radix);
                $unescaped = str_replace(['\\"', "\\'", '\\/', '\\n', '\\t'], ['"', "'", '/', "\n", "\t"], $decoded);

                preg_match_all('#https?://[^\s"\'<>]*?(?:rapidcdn|fbcdn|cdninstagram|scontent)[^\s"\'<>]*#i', $unescaped, $urlMatches);
                $rawUrls = array_unique($urlMatches[0] ?? []);
                $media = [];
                foreach ($rawUrls as $u) {
                    $cleanUrl = str_replace(['\\/', '&amp;'], ['/', '&'], $u);
                    $isVideo = str_contains($cleanUrl, '.mp4') || str_contains($cleanUrl, '/t50.');
                    $media[] = [
                        'url' => $cleanUrl,
                        'video_url' => $isVideo ? $cleanUrl : null,
                        'image_url' => !$isVideo ? $cleanUrl : null,
                        'type' => $isVideo ? 'video' : 'image'
                    ];
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
        }
    } catch (\Exception $e) {}
    return null;
}

// ===== ENGINE 3: HIGH-SPEED PARALLEL PROFILE SCRAPER =====
function fetchInstagramProfilePostsPHP($username, $limit = 12) {
    try {
        $cleanUsername = trim(str_replace(['https://', 'http://', 'www.instagram.com/', 'instagram.com/', '/', '@', 'reels'], '', $username));
        
        $urlsToTry = [
            "https://www.instagram.com/{$cleanUsername}/reels/",
            "https://www.instagram.com/{$cleanUsername}/"
        ];

        $shortcodes = [];

        foreach ($urlsToTry as $url) {
            $resp = Http::timeout(6)->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ])->get($url);

            if ($resp->successful()) {
                $html = $resp->body();
                preg_match_all('/"(?:shortcode|code)":"([A-Za-z0-9_-]+)"/', $html, $matches1);
                preg_match_all('/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/', $html, $matches2);
                
                $merged = array_merge($matches1[1] ?? [], $matches2[1] ?? []);
                foreach ($merged as $sc) {
                    if (!in_array($sc, $shortcodes) && strlen($sc) > 5) {
                        $shortcodes[] = $sc;
                    }
                }
            }
        }

        if (!empty($shortcodes)) {
            $selected = array_slice($shortcodes, 0, min($limit * 2, 24));
            
            // Execute all HTTP requests concurrently in parallel using Pool
            $responses = Http::pool(function (Pool $pool) use ($selected) {
                return array_map(function ($code) use ($pool) {
                    return $pool->as($code)->timeout(5)->withHeaders([
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    ])->get("https://www.instagram.com/p/{$code}/embed/captioned/");
                }, $selected);
            });

            $posts = [];

            foreach ($selected as $code) {
                if (count($posts) >= $limit) break;

                $embedResp = $responses[$code] ?? null;
                if ($embedResp && $embedResp->successful()) {
                    $embedHtml = $embedResp->body();
                    $videoUrl = null;
                    $imageUrl = null;

                    if (preg_match('/"video_url"\s*:\s*"([^"]+)"/', $embedHtml, $vMatch)) {
                        $videoUrl = stripcslashes(html_entity_decode($vMatch[1]));
                    }
                    if (preg_match('/"video_src"\s*:\s*"([^"]+)"/', $embedHtml, $vMatch2)) {
                        $videoUrl = stripcslashes(html_entity_decode($vMatch2[1]));
                    }
                    if (preg_match('/"display_url"\s*:\s*"([^"]+)"/', $embedHtml, $iMatch)) {
                        $imageUrl = stripcslashes(html_entity_decode($iMatch[1]));
                    }

                    if (!$videoUrl || !$imageUrl) {
                        preg_match_all('#https?://[^\s"\'<>]*?(?:fbcdn|cdninstagram|scontent)[^\s"\'<>]*#i', $embedHtml, $mediaMatches);
                        foreach ($mediaMatches[0] ?? [] as $mUrl) {
                            $cleanMUrl = html_entity_decode(str_replace(['\\/', '&amp;'], ['/', '&'], $mUrl));
                            if ((str_contains($cleanMUrl, '.mp4') || str_contains($cleanMUrl, '/t50.')) && !$videoUrl) {
                                $videoUrl = $cleanMUrl;
                            } else if ((str_contains($cleanMUrl, '/t51.') || str_contains($cleanMUrl, '.jpg')) && !$imageUrl) {
                                $imageUrl = $cleanMUrl;
                            }
                        }
                    }

                    $isVideo = !empty($videoUrl);
                    $finalUrl = $isVideo ? $videoUrl : $imageUrl;

                    if ($finalUrl) {
                        $posts[] = [
                            'id' => $code,
                            'url' => $finalUrl,
                            'video_url' => $videoUrl,
                            'image_url' => $imageUrl ?: $finalUrl,
                            'type' => $isVideo ? 'video' : 'image',
                            'preview' => $imageUrl ?: $finalUrl
                        ];
                    }
                }
            }

            if (!empty($posts)) {
                return $posts;
            }
        }
    } catch (\Exception $e) {}
    return null;
}

// ===== ENGINE 4: DEDICATED STORY & HIGHLIGHT SCRAPER =====
function fetchInstagramStoriesPHP($input) {
    try {
        $targetUrl = trim($input);

        if (!str_starts_with($targetUrl, 'http://') && !str_starts_with($targetUrl, 'https://')) {
            $cleanUsername = trim(str_replace(['@', '/'], '', $targetUrl));
            $targetUrl = "https://www.instagram.com/stories/{$cleanUsername}/";
        }

        // 1. Try Cobalt API
        $cobaltRes = fetchCobaltInstagram($targetUrl);
        if ($cobaltRes && !empty($cobaltRes['media'])) {
            return array_map(function ($item, $idx) {
                $isVideo = ($item['type'] ?? '') === 'video' || str_contains($item['url'], '.mp4') || str_contains($item['url'], '/t50.');
                return [
                    'id' => 'story_' . $idx . '_' . time(),
                    'url' => $item['url'],
                    'video_url' => $isVideo ? $item['url'] : null,
                    'image_url' => !$isVideo ? $item['url'] : null,
                    'type' => $isVideo ? 'video' : 'image',
                    'preview' => $item['url']
                ];
            }, $cobaltRes['media'], array_keys($cobaltRes['media']));
        }

        // 2. Try SnapSave
        $snapRes = fetchSnapSaveMediaPHP($targetUrl);
        if ($snapRes && !empty($snapRes['media'])) {
            return array_map(function ($item, $idx) {
                $isVideo = ($item['type'] ?? '') === 'video' || str_contains($item['url'], '.mp4') || str_contains($item['url'], '/t50.');
                return [
                    'id' => 'story_' . $idx . '_' . time(),
                    'url' => $item['url'],
                    'video_url' => $isVideo ? $item['url'] : null,
                    'image_url' => !$isVideo ? $item['url'] : null,
                    'type' => $isVideo ? 'video' : 'image',
                    'preview' => $item['url']
                ];
            }, $snapRes['media'], array_keys($snapRes['media']));
        }
    } catch (\Exception $e) {}
    return null;
}

// API Download Handler
Route::post('/api/download', function (Request $request) {
    $data = json_decode($request->getContent(), true) ?: $request->all();
    $type = $data['type'] ?? $request->input('type') ?? 'single';
    $rawUrl = $data['url'] ?? $request->input('url') ?? '';
    $rawUsername = $data['username'] ?? $request->input('username') ?? '';
    $limit = intval($data['limit'] ?? $request->input('limit') ?? 12);

    $targetInput = $rawUrl ?: $rawUsername;

    // If stories request
    if ($type === 'stories') {
        $storyPosts = fetchInstagramStoriesPHP($rawUsername ?: $targetInput);
        if ($storyPosts && !empty($storyPosts)) {
            return response()->json(['stories' => $storyPosts])->header('Access-Control-Allow-Origin', '*');
        }
    }

    // If bulk request (photos & videos)
    if ($type === 'bulk-fetch' || $type === 'bulk-video' || $type === 'bulk') {
        $bulkPosts = fetchInstagramProfilePostsPHP($rawUsername ?: $targetInput, $limit);
        if ($bulkPosts && !empty($bulkPosts)) {
            return response()->json(['posts' => $bulkPosts])->header('Access-Control-Allow-Origin', '*');
        }
    }

    // Convert username to Instagram URL if needed
    if (!str_starts_with($targetInput, 'http')) {
        $cleanUser = trim(str_replace('@', '', $targetInput));
        $targetInput = "https://www.instagram.com/{$cleanUser}/";
    }

    $shortcode = getInstagramShortcode($targetInput);
    $result = null;

    // 1. Try Cobalt API
    $result = fetchCobaltInstagram($targetInput);

    // 2. Try SnapSave PHP Deobfuscator
    if (!$result) {
        $result = fetchSnapSaveMediaPHP($targetInput);
    }

    if ($result) {
        if ($type === 'bulk-fetch' || $type === 'bulk-video' || $type === 'stories' || $type === 'bulk') {
            $posts = array_map(function ($item, $idx) {
                $isVideo = ($item['type'] ?? '') === 'video' || str_contains($item['url'], '.mp4') || str_contains($item['url'], '/t50.');
                return [
                    'id' => 'post_' . $idx . '_' . time(),
                    'url' => $item['url'],
                    'video_url' => $isVideo ? $item['url'] : null,
                    'image_url' => !$isVideo ? $item['url'] : null,
                    'type' => $isVideo ? 'video' : 'image',
                    'preview' => $item['url']
                ];
            }, $result['media'], array_keys($result['media']));
            return response()->json($type === 'stories' ? ['stories' => $posts] : ['posts' => $posts])
                ->header('Access-Control-Allow-Origin', '*');
        }
        return response()->json($result)->header('Access-Control-Allow-Origin', '*');
    }

    return response()->json([
        'error' => 'Could not fetch Instagram media. Please verify username or link is valid and public.'
    ], 422)->header('Access-Control-Allow-Origin', '*');
});

// API Proxy Handler - HIGH SPEED PROXY STREAMING
Route::get('/api/proxy', function (Request $request) {
    $targetUrl = $request->query('url');
    $format = strtolower($request->query('format', ''));
    $type = strtolower($request->query('type', ''));

    if (!$targetUrl) {
        return response('Missing URL parameter', 400)->header('Access-Control-Allow-Origin', '*');
    }

    try {
        $response = Http::timeout(10)->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer' => 'https://www.instagram.com/'
        ])->get($targetUrl);

        $remoteContentType = strtolower($response->header('Content-Type') ?? '');

        $isVideo = str_contains($targetUrl, '.mp4') 
                || str_contains($targetUrl, '/t50.') 
                || str_contains($remoteContentType, 'video') 
                || $type === 'video' 
                || $format === 'video';

        $headers = [
            'Access-Control-Allow-Origin' => '*',
            'Cache-Control' => 'public, max-age=86400'
        ];

        if ($format === 'mp3' || $format === 'audio') {
            $headers['Content-Type'] = 'audio/mpeg';
            $headers['Content-Disposition'] = 'attachment; filename="instagram_audio_' . time() . '.mp3"';
        } else if ($isVideo) {
            $headers['Content-Type'] = 'video/mp4';
            $headers['Content-Disposition'] = 'attachment; filename="instagram_video_' . time() . '.mp4"';
        } else {
            $headers['Content-Type'] = 'image/jpeg';
            $headers['Content-Disposition'] = 'attachment; filename="instagram_image_' . time() . '.jpg"';
        }

        return response($response->body(), 200, $headers);
    } catch (\Exception $e) {
        return response('Proxy error: ' . $e->getMessage(), 500)->header('Access-Control-Allow-Origin', '*');
    }
});
