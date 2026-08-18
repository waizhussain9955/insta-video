"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Music, Download, AlertCircle, Loader2, Sparkles, Volume2, Headphones, Play, Pause, ShieldCheck, Zap } from "lucide-react";
import { API_BASE_URL, requestDownloaderApi } from "../config";

interface MediaItem {
  url: string;
  video_url?: string;
  type: string;
  preview?: string;
}

interface ScrapeResult {
  success: boolean;
  owner?: string;
  caption?: string;
  media_type?: string;
  media?: MediaItem[];
  posts?: MediaItem[];
}

function AudioDownloaderContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
    setAudioSrc(null);
    setIsPlaying(false);

    try {
      const data = await requestDownloaderApi({
        type: "single",
        url: targetUrl
      });

      const mediaItems = data.media || data.posts || [];
      if (mediaItems.length === 0) {
        throw new Error("No video or audio track found for this Instagram link. Verify the link is public.");
      }

      const firstVideo = mediaItems.find((m: any) => m.type === "video" || (m.url && m.url.includes(".mp4"))) || mediaItems[0];
      const rawMediaUrl = firstVideo.video_url || firstVideo.url;

      // Construct MP3 Proxy Stream URL
      const proxyAudioUrl = API_BASE_URL && API_BASE_URL.trim() !== ""
        ? `${API_BASE_URL.replace(/\/$/, "")}/api/proxy?url=${encodeURIComponent(rawMediaUrl)}&format=mp3`
        : `/api/proxy?url=${encodeURIComponent(rawMediaUrl)}&format=mp3`;

      setResult(data);
      setAudioSrc(proxyAudioUrl);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to extract MP3 audio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
        }
      }
    } catch (e) {}
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400 px-3.5 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full">
          <Headphones className="h-3.5 w-3.5" />
          Instagram to MP3 Converter
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-4 sm:text-5xl">
          Instagram <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">MP3 & Audio</span> Downloader
        </h1>
        <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
          Extract high-fidelity 320kbps MP3 audio soundtracks, songs, and voice notes from any Instagram Reel or Video in seconds.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Paste Instagram Reel or Video Link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full glass-input text-white rounded-xl pl-5 pr-20 py-4 text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              required
            />
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-zinc-300 rounded-lg transition-all"
            >
              Paste
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl px-8 py-4 flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Music className="h-5 w-5" />
            )}
            <span>{loading ? "Extracting..." : "Extract MP3"}</span>
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 mb-8">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Audio Result Card */}
      {audioSrc && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-500/20 shadow-2xl mb-12 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Audio Icon / Visualizer Box */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/30 flex-shrink-0">
              <Volume2 className="h-12 w-12 animate-pulse" />
            </div>

            {/* Track Info & Player */}
            <div className="flex-grow w-full space-y-4 text-center md:text-left">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-md">
                  High-Quality 320kbps MP3
                </span>
                <h3 className="text-xl font-bold text-white mt-2 truncate">
                  {result?.caption ? result.caption.slice(0, 50) + "..." : "Instagram Audio Soundtrack"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Owner: <span className="text-zinc-200">@{result?.owner || "instagram_user"}</span>
                </p>
              </div>

              {/* Native Audio Player */}
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <audio
                  controls
                  src={audioSrc}
                  className="w-full h-10 outline-none"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>

              {/* Download Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={audioSrc}
                  download={`instagram_audio_${Date.now()}.mp3`}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download MP3 Audio (320kbps)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center flex flex-col items-center">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl mb-3">
            <Zap className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Instant Audio Conversion</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Extracts original sound stream directly without recoding or audio quality compression.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center flex flex-col items-center">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl mb-3">
            <Volume2 className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Studio 320kbps Quality</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Get crystal clear stereo sound ready for your ringtones, remixes, and offline music library.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center flex flex-col items-center">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">100% Free & Anonymous</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Download unlimited audio clips without watermarks, subscriptions, or account logins.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AudioDownloaderPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-zinc-400">Loading Audio Downloader...</div>}>
      <AudioDownloaderContent />
    </Suspense>
  );
}
