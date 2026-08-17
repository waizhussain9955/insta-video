<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class InstagramController extends Controller
{
    public function download(Request $request)
    {
        $type = $request->input('type');
        $url = $request->input('url');
        $username = $request->input('username');
        $limit = $request->input('limit', 12);

        if ($type === 'single') {
            if (!$url) {
                return response()->json(['error' => 'URL is required'], 400)
                    ->header('Access-Control-Allow-Origin', '*');
            }
            return $this->handleDownload($url);
        }

        if ($type === 'stories') {
            if (!$username) {
                return response()->json(['error' => 'Username is required'], 400)
                    ->header('Access-Control-Allow-Origin', '*');
            }
            return $this->handleDownload("https://www.instagram.com/stories/{$username}/");
        }

        if ($type === 'bulk-fetch') {
            if (!$username) {
                return response()->json(['error' => 'Username is required'], 400)
                    ->header('Access-Control-Allow-Origin', '*');
            }
            return $this->handleDownload("https://www.instagram.com/{$username}/");
        }

        return response()->json(['error' => 'Invalid request type'], 400)
            ->header('Access-Control-Allow-Origin', '*');
    }

    private function handleDownload($targetUrl)
    {
        // 1. Try RapidAPI if key configured
        $apiKey = env('RAPIDAPI_KEY');
        $apiHost = env('RAPIDAPI_HOST', 'social-media-video-downloader.p.rapidapi.com');

        if ($apiKey && $apiKey !== 'wp_instasave_rapidapi_key_demo_12345' && trim($apiKey) !== '') {
            try {
                $response = Http::timeout(20)->withHeaders([
                    'X-RapidAPI-Key' => $apiKey,
                    'X-RapidAPI-Host' => $apiHost,
                ])->get("https://{$apiHost}/instagram", [
                    'url' => $targetUrl
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $rawMedia = $data['media'] ?? $data['result'] ?? [];
                    $media = [];

                    if (is_array($rawMedia)) {
                        foreach ($rawMedia as $m) {
                            $mUrl = $m['url'] ?? $m['downloadUrl'] ?? $m['link'] ?? '';
                            if ($mUrl) {
                                $media[] = [
                                    'url' => $mUrl,
                                    'type' => ($m['type'] ?? '') === 'video' || str_contains($mUrl, '.mp4') ? 'video' : 'image'
                                ];
                            }
                        }
                    }

                    if (empty($media) && !empty($data['url'])) {
                        $media[] = [
                            'url' => $data['url'],
                            'type' => str_contains($data['url'], '.mp4') ? 'video' : 'image'
                        ];
                    }

                    if (!empty($media)) {
                        return response()->json([
                            'success' => true,
                            'owner' => $data['owner'] ?? $data['username'] ?? 'instagram_user',
                            'caption' => $data['caption'] ?? $data['title'] ?? '',
                            'media_type' => count($media) > 1 ? 'carousel' : $media[0]['type'],
                            'media' => $media
                        ])->header('Access-Control-Allow-Origin', '*');
                    }
                }
            } catch (\Exception $e) {
                // Fallback to Cobalt
            }
        }

        // 2. Fallback: Cobalt Scraper API
        try {
            $response = Http::timeout(15)->withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json'
            ])->post('https://api.cobalt.liubquanti.click/', [
                'url' => $targetUrl
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $media = [];

                if (($data['status'] ?? '') === 'redirect' && !empty($data['url'])) {
                    $isVideo = str_contains($data['url'], '.mp4') || str_ends_with($data['filename'] ?? '', '.mp4');
                    $media[] = [
                        'url' => $data['url'],
                        'type' => $isVideo ? 'video' : 'image'
                    ];
                } elseif (($data['status'] ?? '') === 'stream' && !empty($data['url'])) {
                    $media[] = [
                        'url' => $data['url'],
                        'type' => 'video'
                    ];
                } elseif (($data['status'] ?? '') === 'picker' && is_array($data['picker'] ?? null)) {
                    foreach ($data['picker'] as $item) {
                        if (!empty($item['url'])) {
                            $media[] = [
                                'url' => $item['url'],
                                'type' => ($item['type'] ?? '') === 'video' ? 'video' : 'image'
                            ];
                        }
                    }
                }

                if (!empty($media)) {
                    return response()->json([
                        'success' => true,
                        'owner' => 'instagram_user',
                        'caption' => '',
                        'media_type' => count($media) > 1 ? 'carousel' : $media[0]['type'],
                        'media' => $media
                    ])->header('Access-Control-Allow-Origin', '*');
                }
            }
        } catch (\Exception $e) {
            // Error
        }

        return response()->json([
            'error' => 'Could not fetch Instagram media. Please verify the link is public.'
        ], 422)->header('Access-Control-Allow-Origin', '*');
    }

    public function proxy(Request $request)
    {
        $targetUrl = $request->query('url');

        if (!$targetUrl) {
            return response('Missing URL parameter', 400)
                ->header('Access-Control-Allow-Origin', '*');
        }

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer' => 'https://www.instagram.com/'
            ])->get($targetUrl);

            return response($response->body(), 200, [
                'Content-Type' => str_contains($targetUrl, '.mp4') ? 'video/mp4' : 'image/jpeg',
                'Access-Control-Allow-Origin' => '*',
                'Cache-Control' => 'public, max-age=86400'
            ]);
        } catch (\Exception $e) {
            return response('Proxy error: ' . $e->getMessage(), 500)
                ->header('Access-Control-Allow-Origin', '*');
        }
    }
}
