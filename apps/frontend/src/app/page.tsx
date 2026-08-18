"use client";

import Link from "next/link";
import { Download, Film, Image, Layers, PlayCircle, ShieldCheck, Zap, Music, Headphones } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      router.push(`/single?url=${encodeURIComponent(url.trim())}`);
    }
  };

  const features = [
    {
      icon: <Film className="h-6 w-6 text-primary" />,
      title: "Instagram Reels",
      desc: "Download full HD Reels and videos in seconds.",
      href: "/single"
    },
    {
      icon: <Music className="h-6 w-6 text-cyan-400" />,
      title: "MP3 Audio Downloader",
      desc: "Extract high-quality 320kbps MP3 audio soundtracks from Reels.",
      href: "/audio"
    },
    {
      icon: <PlayCircle className="h-6 w-6 text-accent" />,
      title: "Instagram Stories",
      desc: "Fetch and download active user stories anonymously.",
      href: "/story"
    },
    {
      icon: <Layers className="h-6 w-6 text-green-400" />,
      title: "Bulk Profile Downloads",
      desc: "Scrape entire profiles and download selected media as a ZIP.",
      href: "/bulk"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="relative w-full py-20 lg:py-32 overflow-hidden flex flex-col items-center">
        <div className="mx-auto max-w-4xl px-4 text-center z-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            Premium Instagram <br />
            <span className="text-gradient">Media & Audio Downloader</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            High-speed, completely free, and anonymous downloading. Save Reels, MP3 audio, stories, and entire profiles instantly with zero quality loss.
          </p>

          {/* Quick Input Bar */}
          <form onSubmit={handleSearch} className="mt-10 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Paste Instagram link here (e.g. https://www.instagram.com/reel/...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-grow glass-input text-white rounded-xl px-5 py-4 text-sm"
              required
            />
            <button
              type="submit"
              className="gradient-btn text-white font-semibold rounded-xl px-8 py-4 flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </form>
        </div>
      </section>

      {/* Feature Section */}
      <section className="w-full py-16 bg-black/40 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Supports All Media & Audio Types
            </h2>
            <p className="mt-4 text-zinc-400">
              Download Reels, MP4 Videos, 320kbps MP3 Audio, and Stories directly to your device.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <Link
                key={idx}
                href={feature.href}
                className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-white/20 transition-all group"
              >
                <div>
                  <div className="p-3 bg-white/5 rounded-xl inline-block mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
                <span className="mt-6 text-xs text-primary font-semibold flex items-center gap-1 group-hover:underline">
                  Go to tool &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center">
            <Zap className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Ultra Fast Downloads</h3>
            <p className="text-sm text-zinc-400">
              High-concurrency backend processes media extractions and MP3 conversions in milliseconds.
            </p>
          </div>
          <div className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center">
            <ShieldCheck className="h-10 w-10 text-secondary mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">100% Secure & Anonymous</h3>
            <p className="text-sm text-zinc-400">
              We never expose or link direct Instagram URLs, keeping your source requests hidden through proxy routing.
            </p>
          </div>
          <div className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center">
            <Headphones className="h-10 w-10 text-cyan-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Crystal Clear 320kbps MP3</h3>
            <p className="text-sm text-zinc-400">
              Extract high-bitrate studio audio soundtracks directly from any reel or video with 1 click.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
