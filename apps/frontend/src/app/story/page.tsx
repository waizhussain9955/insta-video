"use client";

import { useState } from "react";
import axios from "axios";
import { Download, AlertCircle, Loader2, PlayCircle, Eye, Music, Film, Play } from "lucide-react";
import { API_BASE_URL } from "../config";
import JSZip from "jszip";

interface StoryItem {
  url: string;
  type: string; // video, image
  preview: string;
}

export default function StoryDownloader() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState("");
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [videoState, setVideoState] = useState<Record<number, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetInput = username.trim();
    if (!targetInput) return;

    setLoading(true);
    setError("");
    setStories([]);
    setVideoState({});

    try {
      const response = await axios.post(`${API_BASE_URL}/api/download`, {
        type: "stories",
        username: targetInput
      });
      const fetchedStories = response.data.stories || [];
      setStories(fetchedStories);
      
      // Auto-detect video type for items
      const initialVideoState: Record<number, boolean> = {};
      fetchedStories.forEach((story: StoryItem, idx: number) => {
        if (story.type === "video" || story.url.includes(".mp4") || story.url.includes("/t50.") || !story.url.includes(".jpg")) {
          initialVideoState[idx] = true;
        }
      });
      setVideoState(initialVideoState);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch stories/highlights. Please verify link or username is public.");
    } finally {
      setLoading(false);
    }
  };

  const markAsVideo = (idx: number) => {
    setVideoState(prev => ({ ...prev, [idx]: true }));
  };

  const handleDownloadAllZip = async () => {
    if (stories.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < stories.length; i++) {
        const item = stories[i];
        const isVideo = videoState[i] || item.type === "video" || item.url.includes(".mp4") || item.url.includes("/t50.");
        const proxyUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(item.url)}${isVideo ? '&type=video' : ''}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const blob = await res.blob();
          const ext = isVideo ? "mp4" : "jpg";
          zip.file(`story_${i + 1}.${ext}`, blob);
        }
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `stories_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError(`Failed to generate Stories ZIP: ${err.message}`);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary px-3 py-1 bg-secondary/10 rounded-full">
          Tool #2
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-4 sm:text-5xl">
          Instagram <span className="text-gradient">Story & Highlight</span> Downloader
        </h1>
        <p className="mt-4 text-zinc-400">
          Download active stories and highlights from any public profile or highlight link. Save MP4 videos or MP3 audio easily.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter Username or Story/Highlight Link (e.g. instagram.com/s/aGlnaG... or cristiano)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
              <Eye className="h-4 w-4" />
            )}
            <span>{loading ? "Fetching..." : "View Stories"}</span>
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
          <Loader2 className="h-10 w-10 text-secondary animate-spin mb-4" />
          <p className="text-zinc-400 text-sm">Querying active video stories and highlight nodes...</p>
        </div>
      )}

      {stories.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <PlayCircle className="h-5 w-5 text-secondary" />
              <span>Stories / Highlights Found ({stories.length})</span>
            </h2>

            <button
              onClick={handleDownloadAllZip}
              disabled={zipping}
              className="gradient-btn text-white font-semibold rounded-xl px-6 py-2.5 text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {zipping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{zipping ? "Packaging Stories ZIP..." : "Download All Stories (ZIP)"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stories.map((story, idx) => {
              const isVideo = videoState[idx] || story.type === "video" || story.url.includes(".mp4") || story.url.includes("/t50.");
              const proxyVideoUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(story.url)}&type=video`;
              const proxyImageUrl = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(story.url)}`;
              const proxyMp3Url = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(story.url)}&format=mp3`;

              return (
                <div key={idx} className="glass-panel rounded-2xl overflow-hidden relative group border border-white/10 flex flex-col justify-between">
                  <div className="aspect-[9/16] bg-black/40 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] uppercase font-extrabold text-pink-400 tracking-wider z-10 flex items-center space-x-1">
                      {isVideo ? (
                        <>
                          <Play className="h-2.5 w-2.5 text-pink-400 fill-pink-400" />
                          <span>HD MP4 Video</span>
                        </>
                      ) : (
                        <span>HD Photo</span>
                      )}
                    </div>

                    {isVideo ? (
                      <video controls className="w-full h-full object-cover">
                        <source src={proxyVideoUrl} type="video/mp4" />
                      </video>
                    ) : (
                      <img 
                        src={proxyImageUrl} 
                        alt="" 
                        onError={() => markAsVideo(idx)} 
                        className="w-full h-full object-cover" 
                      />
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={isVideo ? proxyVideoUrl : proxyImageUrl}
                        download={`story_${idx + 1}.${isVideo ? 'mp4' : 'jpg'}`}
                        className="flex-1 gradient-btn text-white font-semibold rounded-lg py-2 text-xs flex items-center justify-center space-x-1.5 shadow-md hover:brightness-110 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{isVideo ? "Download MP4" : "Download Photo"}</span>
                      </a>

                      <a
                        href={proxyMp3Url}
                        download={`story_${idx + 1}.mp3`}
                        className="bg-white/10 hover:bg-white/20 text-pink-300 font-semibold rounded-lg px-2.5 py-2 text-xs flex items-center justify-center space-x-1 transition border border-white/10"
                        title="Download Audio Only (MP3)"
                      >
                        <Music className="h-3.5 w-3.5 text-pink-400" />
                        <span>MP3</span>
                      </a>
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
