"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, AlertCircle, Loader2, Sparkles, Music, Film, CheckCircle2 } from "lucide-react";
import { getProxyUrl, requestDownloaderApi } from "../config";
import { convertMediaUrlToMp3Blob, triggerBlobDownload } from "../utils/audioConverter";

interface MediaItem {
  url: string;
  video_url?: string;
  type: string;
}

interface ScrapeResult {
  success: boolean;
  owner: string;
  caption: string;
  media_type: string;
  media: MediaItem[];
}

function SingleDownloaderContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [convertingMp3Idx, setConvertingMp3Idx] = useState<number | null>(null);

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setUrl(urlParam);
      handleDownload(urlParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      handleDownload(url.trim());
    }
  };

  const handleDownload = async (targetUrl: string) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await requestDownloaderApi({
        type: "single",
        url: targetUrl
      });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to fetch Instagram media. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMp3 = async (rawMediaUrl: string, idx: number) => {
    setConvertingMp3Idx(idx);
    try {
      const proxyStreamUrl = getProxyUrl(rawMediaUrl);
      const { blob } = await convertMediaUrlToMp3Blob(proxyStreamUrl);
      const filename = `instagram_audio_${result?.owner || "reel"}_${idx + 1}_${Date.now()}.mp3`;
      triggerBlobDownload(blob, filename);
    } catch (err: any) {
      alert(err.message || "Failed to extract MP3 audio. Post might be silent.");
    } finally {
      setConvertingMp3Idx(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary px-3 py-1 bg-primary/10 rounded-full">
          Reels & Video Tool
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-4 sm:text-5xl">
          Instagram <span className="text-gradient">Reels & Post</span> Downloader
        </h1>
        <p className="mt-4 text-zinc-400">
          Save Reels, Videos, Photos, and Carousel slides. Download in HD MP4 or extract 320kbps MP3 Audio.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Paste Instagram link here (Reel, Photo, Video)..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-grow glass-input text-white rounded-xl px-5 py-4 text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="gradient-btn text-white font-semibold rounded-xl px-8 py-4 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{loading ? "Fetching..." : "Fetch Media"}</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="glass-panel border-red-500/20 bg-red-500/5 p-4 rounded-xl flex items-center space-x-3 mb-8">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-zinc-400 text-sm">Extracting media and audio tracks...</p>
        </div>
      )}

      {result && result.success && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in border border-white/10">
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Media Found!</h2>
            <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full uppercase font-semibold text-zinc-300">
              {result.media_type}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {result.media.map((item, idx) => {
              const mediaUrl = item.video_url || item.url;
              const isVideo = item.type === "video" || (mediaUrl && mediaUrl.includes(".mp4"));
              const proxyDownloadUrl = getProxyUrl(mediaUrl);

              return (
                <div key={idx} className="glass-panel rounded-xl overflow-hidden group relative border border-white/5 bg-zinc-900/60">
                  <div className="aspect-square bg-black/40 relative flex items-center justify-center">
                    <div className="absolute top-3 left-3 bg-black/75 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold text-pink-400 tracking-wide z-10">
                      HD Quality
                    </div>
                    {isVideo ? (
                      <video controls playsInline className="w-full h-full object-contain">
                        <source src={proxyDownloadUrl} type="video/mp4" />
                      </video>
                    ) : (
                      <img src={proxyDownloadUrl} alt="Instagram Media" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-4 border-t border-white/5 space-y-2.5">
                    <a
                      href={proxyDownloadUrl}
                      download={`instagram_${isVideo ? "video" : "photo"}_${idx + 1}.${isVideo ? "mp4" : "jpg"}`}
                      className="w-full gradient-btn text-white font-semibold rounded-lg py-2.5 text-xs flex items-center justify-center space-x-2 shadow-md shadow-pink-500/20"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download {isVideo ? "HD Video (MP4)" : "HD Photo"}</span>
                    </a>
                    {isVideo && (
                      <button
                        type="button"
                        onClick={() => handleDownloadMp3(mediaUrl, idx)}
                        disabled={convertingMp3Idx === idx}
                        className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-cyan-300 font-semibold rounded-lg py-2.5 text-xs flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                      >
                        {convertingMp3Idx === idx ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                        ) : (
                          <Music className="h-3.5 w-3.5 text-cyan-400" />
                        )}
                        <span>{convertingMp3Idx === idx ? "Converting to MP3..." : "Download Real MP3 Audio (320kbps)"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {result.caption && (
            <div className="mt-8 border-t border-white/5 pt-6">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Caption</h3>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                {result.caption}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SingleDownloader() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-zinc-400 text-sm">Loading single downloader...</p>
      </div>
    }>
      <SingleDownloaderContent />
    </Suspense>
  );
}
