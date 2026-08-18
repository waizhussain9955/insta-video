"use client";

import { useState } from "react";
import axios from "axios";
import { Download, AlertCircle, Loader2, Library, CheckSquare, Square, Film, Music, Play, Image as ImageIcon, Sparkles, Layers } from "lucide-react";
import { API_BASE_URL } from "../config";
import JSZip from "jszip";

interface ProfileMedia {
  id: string;
  url: string;
  video_url?: string;
  image_url?: string;
  type: string; // "video" | "image"
  preview: string;
}

export default function BulkDownloader() {
  const [username, setUsername] = useState("");
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<ProfileMedia[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "videos" | "photos">("all");
  const [videoState, setVideoState] = useState<Record<string, boolean>>({});

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetUsername = username.trim();
    if (targetUsername.includes("instagram.com")) {
      const match = targetUsername.match(/instagram\.com\/(?:reels\/)?([a-zA-Z0-9_\.]+)/i);
      if (match) {
        targetUsername = match[1];
        setUsername(targetUsername);
      }
    }
    if (!targetUsername) return;

    setLoading(true);
    setError("");
    setPosts([]);
    setSelected([]);
    setVideoState({});

    try {
      const response = await axios.post(`${API_BASE_URL}/api/download`, {
        type: "bulk-fetch",
        username: targetUsername,
        limit
      });
      const fetchedPosts = response.data.posts || [];
      setPosts(fetchedPosts);
      setSelected(fetchedPosts.map((p: ProfileMedia) => p.id));

      const initialVidState: Record<string, boolean> = {};
      fetchedPosts.forEach((p: ProfileMedia) => {
        if (p.type === "video" || p.url.includes(".mp4") || p.url.includes("/t50.")) {
          initialVidState[p.id] = true;
        }
      });
      setVideoState(initialVidState);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch profile media. Please verify account is public.");
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

  const selectAllFiltered = (filteredList: ProfileMedia[]) => {
    const ids = filteredList.map(p => p.id);
    setSelected(Array.from(new Set([...selected, ...ids])));
  };

  const deselectAll = () => {
    setSelected([]);
  };

  const markAsVideo = (id: string) => {
    setVideoState(prev => ({ ...prev, [id]: true }));
  };

  // Filtered posts based on active tab
  const filteredPosts = posts.filter(post => {
    const isVid = videoState[post.id] || post.type === "video" || post.url.includes(".mp4") || post.url.includes("/t50.");
    if (filterTab === "videos") return isVid;
    if (filterTab === "photos") return !isVid;
    return true;
  });

  const videoCount = posts.filter(p => videoState[p.id] || p.type === "video" || p.url.includes(".mp4") || p.url.includes("/t50.")).length;
  const photoCount = posts.length - videoCount;

  const handleBulkDownload = async () => {
    if (selected.length === 0) return;

    setZipping(true);
    setError("");

    let targetUsername = username.trim();
    if (targetUsername.includes("instagram.com")) {
      const match = targetUsername.match(/instagram\.com\/([a-zA-Z0-9_\.]+)/i);
      if (match) {
        targetUsername = match[1];
      }
    }

    try {
      const zip = new JSZip();
      const selectedPosts = posts.filter(p => selected.includes(p.id));

      for (let i = 0; i < selectedPosts.length; i++) {
        const item = selectedPosts[i];
        const isVid = videoState[item.id] || item.type === "video" || item.url.includes(".mp4") || item.url.includes("/t50.");
        const proxyUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(item.url)}${isVid ? '&type=video' : ''}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch media file ${i + 1}`);
        }
        
        const blob = await response.blob();
        const ext = isVid ? "mp4" : "jpg";
        const filename = `${targetUsername}_media_${i + 1}.${ext}`;
        zip.file(filename, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${targetUsername}_bulk_media_${Date.now()}.zip`;
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-pink-400 px-3 py-1 bg-pink-500/10 rounded-full flex items-center justify-center w-fit mx-auto space-x-1">
          <Sparkles className="h-3 w-3 text-pink-400" />
          <span>All-In-One Profile Downloader</span>
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-4 sm:text-5xl">
          Instagram <span className="text-gradient">Bulk Profile</span> Downloader
        </h1>
        <p className="mt-4 text-zinc-400">
          Harvest all Posts, Reels, MP4 Videos, and Photos from any public profile. Filter videos vs photos effortlessly and package them into a single high-speed ZIP.
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
          <label className="text-xs text-zinc-400 mb-2 block">Post Count Limit</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full glass-input text-white rounded-xl px-4 py-3.5 text-sm bg-zinc-900/90"
          >
            <option value={12}>12 Items</option>
            <option value={24}>24 Items</option>
            <option value={50}>50 Items</option>
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
              <Library className="h-4 w-4" />
            )}
            <span>{loading ? "Fetching Profile Content (High-Speed Parallel API)..." : "Fetch Profile Content"}</span>
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
          <p className="text-zinc-400 text-sm">Harvesting media via high-speed parallel engine...</p>
        </div>
      )}

      {posts.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in">
          {/* Top Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setFilterTab("all")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  filterTab === "all" ? "bg-pink-500 text-white shadow-md shadow-pink-500/30" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>All Media ({posts.length})</span>
              </button>

              <button
                onClick={() => setFilterTab("videos")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  filterTab === "videos" ? "bg-pink-500 text-white shadow-md shadow-pink-500/30" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Film className="h-4 w-4" />
                <span>Reels & Videos Only ({videoCount})</span>
              </button>

              <button
                onClick={() => setFilterTab("photos")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  filterTab === "photos" ? "bg-pink-500 text-white shadow-md shadow-pink-500/30" : "text-zinc-400 hover:text-white"
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Photos Only ({photoCount})</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => selectAllFiltered(filteredPosts)}
                className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10"
              >
                <CheckSquare className="h-4 w-4 text-pink-500" />
                <span>Select All</span>
              </button>
              <button
                onClick={deselectAll}
                className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10"
              >
                <Square className="h-4 w-4 text-zinc-400" />
                <span>Deselect All</span>
              </button>

              <button
                onClick={handleBulkDownload}
                disabled={selected.length === 0 || zipping}
                className="gradient-btn text-white font-semibold rounded-xl px-6 py-2.5 text-xs flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-pink-500/20"
              >
                {zipping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{zipping ? "Packaging ZIP..." : `Download Selected (${selected.length})`}</span>
              </button>
            </div>
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPosts.map((post) => {
              const isSel = selected.includes(post.id);
              const isVid = videoState[post.id] || post.type === "video" || post.url.includes(".mp4") || post.url.includes("/t50.");
              const proxyMediaUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(post.preview || post.url)}`;
              const directMediaDownloadUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(post.url)}${isVid ? '&type=video' : ''}`;
              const directMp3DownloadUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(post.url)}&format=mp3`;

              return (
                <div
                  key={post.id}
                  className={`group relative rounded-2xl overflow-hidden glass-panel border-2 transition-all duration-300 flex flex-col justify-between ${
                    isSel 
                      ? "border-pink-500 ring-4 ring-pink-500/30 shadow-xl shadow-pink-500/20" 
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {/* Thumbnail / Video Box */}
                  <div 
                    onClick={() => toggleSelect(post.id)}
                    className="relative aspect-square w-full bg-zinc-900/80 cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    {/* HD & Video Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 z-10">
                      <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] uppercase font-extrabold text-pink-400 tracking-wider">
                        HD
                      </span>
                      {isVid ? (
                        <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] uppercase font-extrabold text-white flex items-center space-x-1">
                          <Play className="h-2.5 w-2.5 text-pink-400 fill-pink-400" />
                          <span>MP4 Video</span>
                        </span>
                      ) : (
                        <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] uppercase font-extrabold text-zinc-300 flex items-center space-x-1">
                          <ImageIcon className="h-2.5 w-2.5 text-pink-400" />
                          <span>Photo</span>
                        </span>
                      )}
                    </div>

                    {/* Selection Checkbox */}
                    <div className={`absolute top-2.5 right-2.5 p-1 rounded-lg z-10 transition ${
                      isSel ? "bg-pink-500 text-white" : "bg-black/60 text-white/70 backdrop-blur-md"
                    }`}>
                      {isSel ? (
                        <CheckSquare className="h-4 w-4 text-white" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </div>

                    {isVid ? (
                      <video 
                        controls 
                        preload="metadata"
                        poster={proxyMediaUrl}
                        className="w-full h-full object-cover"
                      >
                        <source src={directMediaDownloadUrl} type="video/mp4" />
                      </video>
                    ) : (
                      <img
                        src={proxyMediaUrl}
                        alt=""
                        onError={() => markAsVideo(post.id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={directMediaDownloadUrl}
                        download={`${username}_${isVid ? 'video' : 'photo'}_${post.id}.${isVid ? 'mp4' : 'jpg'}`}
                        className="flex-1 gradient-btn text-white font-semibold rounded-lg py-2 text-xs flex items-center justify-center space-x-1.5 shadow-md hover:brightness-110 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{isVid ? "Download MP4" : "Download Photo"}</span>
                      </a>

                      {isVid && (
                        <a
                          href={directMp3DownloadUrl}
                          download={`${username}_audio_${post.id}.mp3`}
                          className="bg-white/10 hover:bg-white/20 text-pink-300 font-semibold rounded-lg px-3 py-2 text-xs flex items-center justify-center space-x-1 transition border border-white/10"
                          title="Download Audio Only (MP3)"
                        >
                          <Music className="h-3.5 w-3.5 text-pink-400" />
                          <span>MP3</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
