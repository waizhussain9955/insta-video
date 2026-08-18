"use client";

import { useState } from "react";
import axios from "axios";
import { Download, AlertCircle, Loader2, Image as ImageIcon, Sparkles, CheckSquare, Square } from "lucide-react";
import { API_BASE_URL } from "../config";
import JSZip from "jszip";

interface PhotoItem {
  id: string;
  url: string;
  preview: string;
}

export default function PhotoDownloader() {
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = inputUrl.trim();
    if (!rawInput) return;

    setLoading(true);
    setError("");
    setPhotos([]);
    setSelected([]);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/download`, {
        type: rawInput.includes("http") ? "single" : "bulk",
        url: rawInput,
        username: rawInput,
        limit: 12
      });

      const mediaData = response.data;
      let fetchedPhotos: PhotoItem[] = [];

      if (mediaData.media && Array.isArray(mediaData.media)) {
        fetchedPhotos = mediaData.media
          .filter((m: any) => m.type !== "video" && !m.url.includes(".mp4"))
          .map((m: any, idx: number) => ({
            id: `photo_${idx}_${Date.now()}`,
            url: m.url,
            preview: m.url
          }));
      } else if (mediaData.posts && Array.isArray(mediaData.posts)) {
        fetchedPhotos = mediaData.posts
          .filter((p: any) => p.type !== "video" && !p.url.includes(".mp4"))
          .map((p: any) => ({
            id: p.id,
            url: p.url,
            preview: p.preview || p.url
          }));
      }

      if (fetchedPhotos.length === 0) {
        setError("No photos found for this link/profile.");
      } else {
        setPhotos(fetchedPhotos);
        setSelected(fetchedPhotos.map(p => p.id));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch photos. Please verify the link or username is valid.");
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
    setSelected(photos.map(p => p.id));
  };

  const deselectAll = () => {
    setSelected([]);
  };

  const handleDownloadZip = async () => {
    if (selected.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      const selectedPhotos = photos.filter(p => selected.includes(p.id));

      for (let i = 0; i < selectedPhotos.length; i++) {
        const item = selectedPhotos[i];
        const proxyUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(item.url)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const blob = await res.blob();
          zip.file(`photo_${i + 1}.jpg`, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `instagram_photos_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError(`Failed to generate ZIP: ${err.message}`);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-pink-400 px-3 py-1 bg-pink-500/10 rounded-full inline-flex items-center space-x-1">
          <Sparkles className="h-3 w-3 text-pink-400" />
          <span>High-Res Photo Downloader</span>
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-4 sm:text-5xl">
          Instagram <span className="text-gradient">Photo</span> Downloader
        </h1>
        <p className="mt-4 text-zinc-400">
          Download single photos, carousel albums, and profile pictures in original full high resolution.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Paste Instagram photo URL or profile username..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-grow glass-input text-white rounded-xl px-5 py-4 text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="gradient-btn text-white font-semibold rounded-xl px-8 py-4 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            <span>{loading ? "Fetching Photos..." : "Fetch Photos"}</span>
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
          <p className="text-zinc-400 text-sm">Fetching high-res original photos...</p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <button
                onClick={selectAll}
                className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition border border-white/10"
              >
                <CheckSquare className="h-4 w-4 text-pink-500" />
                <span>Select All ({photos.length})</span>
              </button>
              <button
                onClick={deselectAll}
                className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition border border-white/10"
              >
                <Square className="h-4 w-4 text-zinc-400" />
                <span>Deselect All</span>
              </button>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={selected.length === 0 || zipping}
              className="gradient-btn text-white font-semibold rounded-xl px-6 py-2.5 text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {zipping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{zipping ? "Packaging ZIP..." : `Download Selected Photos ZIP (${selected.length})`}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo) => {
              const isSel = selected.includes(photo.id);
              const proxyUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(photo.url)}`;

              return (
                <div
                  key={photo.id}
                  className={`group relative rounded-2xl overflow-hidden glass-panel border-2 transition-all duration-300 flex flex-col justify-between ${
                    isSel 
                      ? "border-pink-500 ring-4 ring-pink-500/30 shadow-xl shadow-pink-500/20" 
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div 
                    onClick={() => toggleSelect(photo.id)}
                    className="relative aspect-square w-full bg-zinc-900/80 cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] uppercase font-extrabold text-pink-400 tracking-wider z-10">
                      HD Photo
                    </div>

                    <div className={`absolute top-2.5 right-2.5 p-1 rounded-lg z-10 transition ${
                      isSel ? "bg-pink-500 text-white" : "bg-black/60 text-white/70 backdrop-blur-md"
                    }`}>
                      {isSel ? (
                        <CheckSquare className="h-4 w-4 text-white" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </div>

                    <img
                      src={proxyUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-3 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md">
                    <a
                      href={proxyUrl}
                      download={`instagram_photo_${photo.id}.jpg`}
                      className="w-full gradient-btn text-white font-semibold rounded-lg py-2 text-xs flex items-center justify-center space-x-1.5 shadow-md hover:brightness-110 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Photo</span>
                    </a>
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
