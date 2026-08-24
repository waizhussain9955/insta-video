"use client";

import { useState } from "react";
import axios from "axios";
import { Download, AlertCircle, Loader2, Library, CheckSquare, Square, Film, Music, Play, Sparkles, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { API_BASE_URL, getProxyUrl, requestDownloaderApi } from "../config";
import { convertMediaUrlToMp3Blob, triggerBlobDownload } from "../utils/audioConverter";
import JSZip from "jszip";

interface ProfileVideo {
  id: string;
  url: string;
  video_url: string;
  type: string;
  preview: string;
}

export default function BulkVideoDownloader() {
  const [username, setUsername] = useState("");
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<ProfileVideo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [brokenPosts, setBrokenPosts] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const cleanInput = (raw: string) => {
    let clean = raw.trim();
    if (clean.includes("?")) {
      clean = clean.split("?")[0];
    }
    clean = clean.replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, "");
    clean = clean.replace(/^[\/@]+|[\/@]+$/g, "");
    const parts = clean.split("/");
    for (const part of parts) {
      const trimmedPart = part.replace("@", "").trim();
      if (trimmedPart && !["reels", "stories", "p", "reel", "tv", "s"].includes(trimmedPart.toLowerCase())) {
        return trimmedPart;
      }
    }
    return clean.replace("@", "");
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTarget = cleanInput(username);
    if (!cleanTarget) return;

    setLoading(true);
    setError("");
    setPosts([]);
    setSelected([]);
    setBrokenPosts({});

    try {
      const data = await requestDownloaderApi({
        type: "bulk-video",
        username: cleanTarget,
        url: cleanTarget,
        limit
      });
      const fetchedPosts = data.posts || [];
      if (fetchedPosts.length === 0) {
        setError("No public reels or videos found for this account. Please check the username or link.");
      } else {
        setPosts(fetchedPosts);
        setSelected(fetchedPosts.map((p: ProfileVideo) => p.id));
      }
    } catch (err: any) {
      let msg = err.response?.data?.error;
      if (!msg) {
        if (err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('timeout'))) {
          msg = "Instagram request timed out. Instagram may be rate-limiting profile queries from shared IPs. Please try entering a direct Reel URL or re-try in a few moments.";
        } else {
          msg = err.message || "Could not fetch profile videos. Please verify the username or link is valid and public.";
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(item => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const selectAll = () => {
    setSelected(validPosts.map(p => p.id));
  };

  const deselectAll = () => {
    setSelected([]);
  };

  const markBroken = (id: string) => {
    setBrokenPosts(prev => ({ ...prev, [id]: true }));
  };

  const validPosts = posts.filter(p => !brokenPosts[p.id]);
  const totalPages = Math.max(1, Math.ceil(validPosts.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, validPosts.length);
  const paginatedPosts = validPosts.slice(startIndex, endIndex);

  const selectCurrentPage = () => {
    const pageIds = paginatedPosts.map(p => p.id);
    const newSelected = Array.from(new Set([...selected, ...pageIds]));
    setSelected(newSelected);
  };

  const handleBulkDownload = async () => {
    if (selected.length === 0) return;

    setZipping(true);
    setError("");
    const cleanTarget = cleanInput(username);

    try {
      const zip = new JSZip();
      const selectedPosts = validPosts.filter(p => selected.includes(p.id));

      for (let i = 0; i < selectedPosts.length; i++) {
        const item = selectedPosts[i];
        const proxyUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(item.url)}&type=video`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch video file ${i + 1}`);
        }
        
        const blob = await response.blob();
        const filename = `${cleanTarget}_video_${i + 1}.mp4`;
        zip.file(filename, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${cleanTarget}_bulk_videos_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

    } catch (err: any) {
      setError(`Failed to generate ZIP package: ${err.message || err}`);
    } finally {
      setZipping(false);
    }
  };

  const [convertingMp3Id, setConvertingMp3Id] = useState<string | null>(null);

  const handleDownloadBulkMp3 = async (rawMediaUrl: string, postId: string) => {
    setConvertingMp3Id(postId);
    try {
      const proxyStreamUrl = getProxyUrl(rawMediaUrl);
      const { blob } = await convertMediaUrlToMp3Blob(proxyStreamUrl);
      const filename = `${username || "instagram"}_audio_${postId}_${Date.now()}.mp3`;
      triggerBlobDownload(blob, filename);
    } catch (err: any) {
      alert(err.message || "This reel has no audio or is silent.");
    } finally {
      setConvertingMp3Id(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-pink-400 px-3 py-1 bg-pink-500/10 rounded-full flex items-center justify-center w-fit mx-auto space-x-1">
          <Sparkles className="h-3 w-3 text-pink-400" />
          <span>100% Video Downloader</span>
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-4 sm:text-5xl">
          Bulk <span className="text-gradient">Reels & Video</span> Downloader
        </h1>
        <p className="mt-4 text-zinc-400">
          Harvest all Reels and MP4 Videos from any public Instagram profile. Download videos individually or package them into a single high-speed ZIP.
        </p>
      </div>

      <form onSubmit={handleFetch} className="glass-panel p-6 rounded-2xl mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="sm:col-span-2">
          <label className="text-xs text-zinc-400 mb-2 block">Instagram Username or Profile Link</label>
          <input
            type="text"
            placeholder="e.g. cristiano or instagram.com/cristiano"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full glass-input text-white rounded-xl px-4 py-3.5 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-2 block">Harvest Limit</label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full glass-input text-white rounded-xl px-4 py-3.5 text-sm bg-zinc-900/90"
          >
            <option value={12}>12 Videos (Page 1)</option>
            <option value={24}>24 Videos (Pages 1 & 2)</option>
            <option value={50}>50 Videos (Max Multi-Page)</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-btn text-white font-semibold rounded-xl py-4 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Film className="h-4 w-4" />
            )}
            <span>{loading ? "Harvesting Reels & Videos (Multi-Page Stream)..." : `Harvest ${limit} Reels & Videos`}</span>
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
          <Loader2 className="h-10 w-10 text-pink-500 animate-spin mb-4" />
          <p className="text-zinc-400 text-sm">Harvesting MP4 video streams from multiple reel timelines...</p>
        </div>
      )}

      {validPosts.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in space-y-6">
          {/* Top Actions & Selection Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={selectAll}
                className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition border border-white/10"
                title="Select all videos across all pages"
              >
                <CheckSquare className="h-4 w-4 text-pink-500" />
                <span>Select All ({validPosts.length})</span>
              </button>
              <button
                onClick={selectCurrentPage}
                className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition border border-white/10"
                title="Select only videos on this current page"
              >
                <Layers className="h-4 w-4 text-pink-400" />
                <span>Select Current Page ({paginatedPosts.length})</span>
              </button>
              <button
                onClick={deselectAll}
                className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition border border-white/10"
              >
                <Square className="h-4 w-4 text-zinc-400" />
                <span>Deselect All</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-zinc-400 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                Selected: <span className="text-pink-400 font-bold">{selected.length}</span> / {validPosts.length}
              </div>

              <button
                onClick={handleBulkDownload}
                disabled={selected.length === 0 || zipping}
                className="gradient-btn text-white font-semibold rounded-xl px-5 py-2.5 text-xs flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-pink-500/20"
              >
                {zipping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{zipping ? "Packaging ZIP..." : `Download ZIP (${selected.length})`}</span>
              </button>
            </div>
          </div>

          {/* Pagination Navigation Controls (Top) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xs text-zinc-300 flex items-center gap-2">
              <span className="font-semibold text-pink-400">Page {safeCurrentPage} of {totalPages}</span>
              <span className="text-zinc-500">•</span>
              <span>Showing {startIndex + 1}–{endIndex} of {validPosts.length} Videos</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Page Size Selector */}
              <div className="flex items-center space-x-2 text-xs text-zinc-400">
                <span>Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-zinc-900 text-white rounded-lg px-2 py-1 text-xs border border-white/10 focus:outline-none"
                >
                  <option value={12}>12 / page</option>
                  <option value={24}>24 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${
                      safeCurrentPage === pg
                        ? "gradient-btn text-white shadow-md shadow-pink-500/30"
                        : "text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid Layout (Current Page) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedPosts.map((post) => {
              const isSel = selected.includes(post.id);
              const proxyMediaUrl = getProxyUrl(post.preview || post.url);
              const directMediaDownloadUrl = getProxyUrl(post.url);

              return (
                <div
                  key={post.id}
                  className={`group relative rounded-2xl overflow-hidden glass-panel border-2 transition-all duration-300 flex flex-col justify-between ${
                    isSel 
                      ? "border-pink-500 ring-4 ring-pink-500/30 shadow-xl shadow-pink-500/20" 
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {/* Thumbnail / Media Box */}
                  <div 
                    onClick={() => toggleSelect(post.id)}
                    className="relative aspect-square w-full bg-zinc-900/80 cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    {/* HD & Video Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 z-10">
                      <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] uppercase font-extrabold text-pink-400 tracking-wider">
                        HD
                      </span>
                      <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] uppercase font-extrabold text-white flex items-center space-x-1">
                        <Play className="h-2.5 w-2.5 text-pink-400 fill-pink-400" />
                        <span>MP4 Reel</span>
                      </span>
                    </div>

                    {/* Top Right Selection Checkbox */}
                    <div className={`absolute top-2.5 right-2.5 p-1 rounded-lg z-10 transition ${
                      isSel ? "bg-pink-500 text-white" : "bg-black/60 text-white/70 backdrop-blur-md"
                    }`}>
                      {isSel ? (
                        <CheckSquare className="h-4 w-4 text-white" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </div>

                    <video 
                      controls 
                      preload="none"
                      poster={proxyMediaUrl}
                      className="w-full h-full object-cover"
                      onError={() => markBroken(post.id)}
                    >
                      <source src={directMediaDownloadUrl} type="video/mp4" />
                    </video>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={directMediaDownloadUrl}
                        download={`${username}_reel_${post.id}.mp4`}
                        className="flex-1 gradient-btn text-white font-semibold rounded-lg py-2 text-xs flex items-center justify-center space-x-1.5 shadow-md hover:brightness-110 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download MP4</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDownloadBulkMp3(post.url, post.id)}
                        disabled={convertingMp3Id === post.id}
                        className="bg-white/10 hover:bg-white/20 text-pink-300 font-semibold rounded-lg px-3 py-2 text-xs flex items-center justify-center space-x-1 transition border border-white/10 cursor-pointer disabled:opacity-50"
                        title="Download Audio Only (MP3)"
                      >
                        {convertingMp3Id === post.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-pink-400" />
                        ) : (
                          <Music className="h-3.5 w-3.5 text-pink-400" />
                        )}
                        <span>MP3</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Pagination Bar (If more than 1 page) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs text-zinc-400">
                Page {safeCurrentPage} of {totalPages} ({validPosts.length} total videos)
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  disabled={safeCurrentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-300 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => {
                      setCurrentPage(pg);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                      safeCurrentPage === pg
                        ? "gradient-btn text-white shadow-md shadow-pink-500/30"
                        : "text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  disabled={safeCurrentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-300 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
