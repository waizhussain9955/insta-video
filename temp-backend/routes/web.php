<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Pool;

Route::get('/', function () {
    return response()->json([
        'status' => 'online',
        'service' => 'Instagram Media Downloader API',
        'version' => '3.1.0',
        'endpoints' => [
            'POST /api/download' => 'Ultra-fast parallel fetching for 100% MP4 Videos, Reels & Stories',
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

// Clean Username / URL Utility (Strips ?utm_source=..., @, domains)
function cleanInstagramUsernamePHP($input) {
    $raw = trim($input);
    if (empty($raw)) return '';
    if (str_contains($raw, '?')) {
        $raw = explode('?', $raw)[0];
    }
    $raw = preg_replace('/^https?:\/\/(?:www\.)?instagram\.com\//i', '', $raw);
    $parts = explode('/', trim($raw, '/'));
    foreach ($parts as $part) {
        $cleanPart = str_replace('@', '', $part);
        if (!empty($cleanPart) && !in_array(strtolower($cleanPart), ['reels', 'stories', 'reel', 'p', 'tv', 's'])) {
            return $cleanPart;
        }
    }
    return str_replace('@', '', $raw);
}

// Extract Shortcode from Instagram Link
function getInstagramShortcode($url) {
    if (empty($url)) return null;
    $clean = explode('?', $url)[0];
    if (preg_match('/(?:p|reel|reels|tv|stories\/[^\/]+|s\/[^\/]+)\/([A-Za-z0-9_:-]+)/i', $clean, $matches)) {
        return $matches[1];
    }
    return null;
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
                    if ($isVideo) {
                        $media[] = [
                            'url' => $cleanUrl,
                            'video_url' => $cleanUrl,
                            'type' => 'video'
                        ];
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
        }
    } catch (\Exception $e) {}
    return null;
}

// ===== ENGINE 3: HIGH-SPEED PARALLEL PROFILE REELS SCRAPER (100% MP4 VIDEOS) =====
function fetchInstagramProfilePostsPHP($usernameInput, $limit = 12) {
    try {
        $cleanUsername = cleanInstagramUsernamePHP($usernameInput);
        if (empty($cleanUsername)) return null;

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
            
            // Parallel HTTP Pool Requests
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

                    if (!$videoUrl) {
                        preg_match_all('#https?://[^\s"\'<>]*?(?:fbcdn|cdninstagram|scontent)[^\s"\'<>]*#i', $embedHtml, $mediaMatches);
                        foreach ($mediaMatches[0] ?? [] as $mUrl) {
                            $cleanMUrl = html_entity_decode(str_replace(['\\/', '&amp;'], ['/', '&'], $mUrl));
                            if (str_contains($cleanMUrl, '.mp4') || str_contains($cleanMUrl, '/t50.')) {
                                $videoUrl = $cleanMUrl;
                                break;
                            } else if (str_contains($cleanMUrl, '/t51.') && !$imageUrl) {
                                $imageUrl = $cleanMUrl;
                            }
                        }
                    }

                    // STRICT FILTER: 100% MP4 VIDEO ONLY
                    if (!empty($videoUrl)) {
                        $posts[] = [
                            'id' => $code,
                            'url' => $videoUrl,
                            'video_url' => $videoUrl,
                            'type' => 'video',
                            'preview' => $imageUrl ?: $videoUrl
                        ];
                    }
                }
            }

            if (!empty($posts)) {
                return $posts;
            }
        }
    } catch (\Exception $e) {}

    // FALLBACK TO COBALT / SNAPSAVE IF HTML PROFILE SCRAPER IS RESTRICTED
    try {
        $cleanUsername = cleanInstagramUsernamePHP($usernameInput);
        $cleanUrl = "https://www.instagram.com/{$cleanUsername}/reels/";
        $cobaltRes = fetchCobaltInstagram($cleanUrl);
        if ($cobaltRes && !empty($cobaltRes['media'])) {
            return array_map(function ($item, $idx) {
                return [
                    'id' => 'reel_' . $idx . '_' . time(),
                    'url' => $item['url'],
                    'video_url' => $item['url'],
                    'type' => 'video',
                    'preview' => $item['url']
                ];
            }, $cobaltRes['media']);
        }
    } catch (\Exception $e) {}

    return null;
}

// ===== ENGINE 4: DEDICATED STORY SCRAPER (100% MP4 VIDEOS) =====
function fetchInstagramStoriesPHP($input) {
    try {
        $cleanUsername = cleanInstagramUsernamePHP($input);
        if (empty($cleanUsername)) return null;

        $targetUrl = "https://www.instagram.com/stories/{$cleanUsername}/";

        // 1. Try Cobalt API
        $cobaltRes = fetchCobaltInstagram($targetUrl);
        if ($cobaltRes && !empty($cobaltRes['media'])) {
            $filtered = [];
            foreach ($cobaltRes['media'] as $idx => $item) {
                $isVideo = ($item['type'] ?? '') === 'video' || str_contains($item['url'], '.mp4') || str_contains($item['url'], '/t50.');
                if ($isVideo) {
                    $filtered[] = [
                        'id' => 'story_' . $idx . '_' . time(),
                        'url' => $item['url'],
                        'video_url' => $item['url'],
                        'type' => 'video',
                        'preview' => $item['url']
                    ];
                }
            }
            if (!empty($filtered)) return $filtered;
        }

        // 2. Try SnapSave
        $snapRes = fetchSnapSaveMediaPHP($targetUrl);
        if ($snapRes && !empty($snapRes['media'])) {
            $filtered = [];
            foreach ($snapRes['media'] as $idx => $item) {
                $isVideo = ($item['type'] ?? '') === 'video' || str_contains($item['url'], '.mp4') || str_contains($item['url'], '/t50.');
                if ($isVideo) {
                    $filtered[] = [
                        'id' => 'story_' . $idx . '_' . time(),
                        'url' => $item['url'],
                        'video_url' => $item['url'],
                        'type' => 'video',
                        'preview' => $item['url']
                    ];
                }
            }
            if (!empty($filtered)) return $filtered;
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

    $rawInput = $rawUrl ?: $rawUsername;
    if (empty($rawInput)) {
        return response()->json(['error' => 'Please provide a valid Instagram username or video link.'], 400);
    }

    $cleanUsername = cleanInstagramUsernamePHP($rawInput);
    $targetInput = "https://www.instagram.com/{$cleanUsername}/";

    // If stories request
    if ($type === 'stories') {
        $storyPosts = fetchInstagramStoriesPHP($cleanUsername);
        if ($storyPosts && !empty($storyPosts)) {
            return response()->json(['stories' => $storyPosts])->header('Access-Control-Allow-Origin', '*');
        }
    }

    // If bulk request (Reels & Videos Only)
    if ($type === 'bulk-fetch' || $type === 'bulk-video' || $type === 'bulk') {
        $bulkPosts = fetchInstagramProfilePostsPHP($cleanUsername, $limit);
        if ($bulkPosts && !empty($bulkPosts)) {
            return response()->json(['posts' => $bulkPosts])->header('Access-Control-Allow-Origin', '*');
        }
    }

    $result = null;

    // 1. Try Cobalt API with clean profile reels URL
    $result = fetchCobaltInstagram("https://www.instagram.com/{$cleanUsername}/reels/");
    if (!$result) {
        $result = fetchCobaltInstagram($targetInput);
    }

    // 2. Try SnapSave PHP Deobfuscator
    if (!$result) {
        $result = fetchSnapSaveMediaPHP($targetInput);
    }

    if ($result) {
        if ($type === 'bulk-fetch' || $type === 'bulk-video' || $type === 'stories' || $type === 'bulk') {
            $posts = array_map(function ($item, $idx) {
                return [
                    'id' => 'post_' . $idx . '_' . time(),
                    'url' => $item['url'],
                    'video_url' => $item['url'],
                    'type' => 'video',
                    'preview' => $item['url']
                ];
            }, $result['media'], array_keys($result['media']));
            return response()->json($type === 'stories' ? ['stories' => $posts] : ['posts' => $posts])
                ->header('Access-Control-Allow-Origin', '*');
        }
        return response()->json($result)->header('Access-Control-Allow-Origin', '*');
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
        $response = Http::timeout(10)->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
