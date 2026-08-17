"use client";

import { useState } from "react";
import axios from "axios";
import { Download, AlertCircle, Loader2, Library, CheckSquare, Square, Film, Image as ImageIcon, Music, Play } from "lucide-react";
import { API_BASE_URL } from "../config";
import JSZip from "jszip";

interface ProfilePost {
  id: string;
  url: string;
  type: string; // video, image
  preview: string;
}

export default function BulkDownloader() {
  const [username, setUsername] = useState("");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetUsername = username.trim();
    if (targetUsername.includes("instagram.com")) {
      const match = targetUsername.match(/instagram\.com\/([a-zA-Z0-9_\.]+)/i);
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
    setFailedImages({});

    try {
      const response = await axios.post(`${API_BASE_URL}/api/download`, {
        type: "bulk-fetch",
        username: targetUsername,
        limit
      });
      const fetchedPosts = response.data.posts || [];
      setPosts(fetchedPosts);
      setSelected(fetchedPosts.map((p: ProfilePost) => p.id));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch profile posts. Please verify the account is public.");
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
    setSelected(posts.map(p => p.id));
  };

  const deselectAll = () => {
    setSelected([]);
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => ({ ...prev, [id]: true }));
  };

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
        const proxyUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(item.url)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch media file ${i + 1}`);
        }
        
        const blob = await response.blob();
        let extension = item.type === "video" || item.url.includes(".mp4") ? "mp4" : "jpg";
        
        const filename = `${targetUsername}_${i + 1}.${extension}`;
        zip.file(filename, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${targetUsername}_videos_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

    } catch (err: any) {
      setError(`Failed to generate ZIP package locally: ${err.message || err}`);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-green-400 px-3 py-1 bg-green-400/10 rounded-full">
          Tool #3
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-4 sm:text-5xl">
          Bulk Video & Media <span className="text-gradient">Downloader</span>
        </h1>
        <p className="mt-4 text-zinc-400">
          Download individual MP4 videos / MP3 audio directly, or pick multiple items to package into a single ZIP file.
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
            <option value={10}>10 Posts</option>
            <option value={20}>20 Posts</option>
            <option value={50}>50 Posts</option>
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
            <span>{loading ? "Fetching Profile Posts..." : "Fetch Profile Content"}</span>
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
          <p className="text-zinc-400 text-sm">Querying profile and harvesting video nodes...</p>
        </div>
      )}

      {posts.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-white/10">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectAll}
                className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition"
              >
                <CheckSquare className="h-4 w-4 text-primary" />
                <span>Select All ({posts.length})</span>
              </button>
              <button
                onClick={deselectAll}
                className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition"
              >
                <Square className="h-4 w-4 text-zinc-400" />
                <span>Deselect All</span>
              </button>
            </div>

            <button
              onClick={handleBulkDownload}
              disabled={selected.length === 0 || zipping}
              className="gradient-btn text-white font-semibold rounded-xl px-6 py-3 text-xs flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-pink-500/20"
            >
              {zipping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{zipping ? "Packaging Videos into ZIP..." : `Download Selected as ZIP (${selected.length})`}</span>
            </button>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {posts.map((post) => {
              const isSel = selected.includes(post.id);
              const isFailed = failedImages[post.id];
              const proxyMediaUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(post.preview || post.url)}`;
              const directMediaDownloadUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(post.url)}`;
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
                      {post.type === "video" && (
                        <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] uppercase font-extrabold text-white flex items-center space-x-1">
                          <Play className="h-2.5 w-2.5 text-pink-400 fill-pink-400" />
                          <span>MP4 Video</span>
                        </span>
                      )}
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

                    {!isFailed ? (
                      <img
                        src={proxyMediaUrl}
                        alt=""
                        onError={() => handleImageError(post.id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <Film className="h-10 w-10 text-pink-500 mb-2 opacity-80" />
                        <span className="text-xs text-zinc-300 font-semibold uppercase">
                          {post.type === "video" ? "Instagram Video" : "Instagram Post"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Individual Download Buttons Action Footer */}
                  <div className="p-3 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={directMediaDownloadUrl}
                        download={`instagram_${post.id}.${post.type === 'video' ? 'mp4' : 'jpg'}`}
                        className="flex-1 gradient-btn text-white font-semibold rounded-lg py-2 text-xs flex items-center justify-center space-x-1.5 shadow-md hover:brightness-110 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{post.type === "video" ? "Download MP4" : "Download Photo"}</span>
                      </a>

                      {post.type === "video" && (
                        <a
                          href={directMp3DownloadUrl}
                          download={`instagram_${post.id}.mp3`}
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
