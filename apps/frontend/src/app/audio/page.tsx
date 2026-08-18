"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Music, Download, AlertCircle, Loader2, Volume2, Headphones, ShieldCheck, Zap, CheckCircle2 } from "lucide-react";
import { getProxyUrl, requestDownloaderApi } from "../config";
import { convertMediaUrlToMp3Blob, triggerBlobDownload } from "../utils/audioConverter";

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
  const [encodingStatus, setEncodingStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setUrl(urlParam);
      handleDownload(urlParam);
    }
  }, [searchParams]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl]);

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
    setAudioBlob(null);
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }
    setEncodingStatus("Connecting to Instagram media nodes...");

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

      // Construct proxy URL for client-side audio conversion
      const proxyAudioStream = getProxyUrl(rawMediaUrl);

      setEncodingStatus("Extracting audio & encoding 320kbps MP3...");
      const { blob } = await convertMediaUrlToMp3Blob(proxyAudioStream, (status) => {
        setEncodingStatus(status);
      });

      const blobUrl = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioBlobUrl(blobUrl);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to extract MP3 audio. Please make sure the Instagram post has sound.");
    } finally {
      setLoading(false);
      setEncodingStatus("");
    }
  };

  const handleDownloadFile = () => {
    if (audioBlob) {
      const name = result?.owner ? `instagram_audio_${result.owner}_${Date.now()}.mp3` : `instagram_audio_${Date.now()}.mp3`;
      triggerBlobDownload(audioBlob, name);
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
          Instagram to 320kbps MP3
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-4 sm:text-5xl">
          Instagram <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">MP3 & Audio</span> Downloader
        </h1>
        <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
          Extract pure, high-fidelity 320kbps MP3 audio soundtracks from any Instagram Reel or Video in seconds.
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
            className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl px-8 py-4 flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 cursor-pointer"
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

      {/* Loading Status Progress */}
      {loading && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 text-center mb-8 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-3" />
          <p className="text-cyan-300 text-sm font-medium">{encodingStatus || "Processing audio stream..."}</p>
          <p className="text-zinc-500 text-xs mt-1">Extracting clean audio channels & encoding real MP3...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 mb-8">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Audio Result Card */}
      {audioBlobUrl && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-500/30 shadow-2xl mb-12 animate-in fade-in zoom-in-95 duration-300 bg-zinc-950/80">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Audio Icon Box */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/30 flex-shrink-0">
              <Volume2 className="h-12 w-12 animate-pulse" />
            </div>

            {/* Track Info & Player */}
            <div className="flex-grow w-full space-y-4 text-center md:text-left">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/15 border border-cyan-400/30 px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="h-3 w-3" />
                  100% Genuine 320kbps MP3 Ready
                </span>
                <h3 className="text-xl font-bold text-white mt-2 truncate">
                  {result?.caption ? result.caption.slice(0, 60) + "..." : "Instagram Audio Soundtrack"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Creator: <span className="text-zinc-200">@{result?.owner || "instagram_user"}</span> &bull; Format: <span className="text-cyan-400 font-semibold">MPEG-1 Layer 3 (.mp3)</span>
                </p>
              </div>

              {/* Native Audio Player with Real Decoded Blob */}
              <div className="bg-black/60 p-3.5 rounded-xl border border-white/10">
                <audio
                  controls
                  src={audioBlobUrl}
                  className="w-full h-10 outline-none"
                  preload="auto"
                />
              </div>

              {/* Download Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="flex-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all text-sm cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download MP3 Audio (320kbps)</span>
                </button>
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
          <h4 className="text-base font-bold text-white mb-1">True MP3 Encoding</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Converts directly into real MPEG Layer-3 audio files playable across all media players and devices.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center flex flex-col items-center">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl mb-3">
            <Volume2 className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Studio 320kbps Bitrate</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Delivers full-spectrum stereo audio without background distortion or bitrate drop.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center flex flex-col items-center">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">100% Free & Unlimited</h4>
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
