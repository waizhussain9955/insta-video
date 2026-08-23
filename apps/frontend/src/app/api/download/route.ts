import { NextResponse } from "next/server";
import axios from "axios";

// Clean Instagram Username / URL helper
function cleanInstagramUser(input: string): string {
  let clean = input.trim();
  if (clean.includes("?")) {
    clean = clean.split("?")[0];
  }
  clean = clean.replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, "");
  clean = clean.replace(/^[\/@]+|[\/@]+$/g, "");
  const parts = clean.split("/");
  for (const part of parts) {
    const trimmed = part.replace("@", "").trim();
    if (trimmed && !["reels", "stories", "p", "reel", "tv", "s"].includes(trimmed.toLowerCase())) {
      return trimmed;
    }
  }
  return clean.replace("@", "");
}

// ===== ENGINE 0: MANAGED RAPIDAPI ENGINE =====
async function fetchFromRapidAPI(targetUrl: string, apiKey: string, apiHost: string = "social-media-video-downloader.p.rapidapi.com") {
  try {
    const resp = await axios.get(`https://${apiHost}/smvd/get/all`, {
      params: { url: targetUrl },
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost
      },
      timeout: 15000
    });

    const data = resp.data;
    const media: any[] = [];

    if (Array.isArray(data.links)) {
      for (const item of data.links) {
        if (item.link) {
          media.push({
            url: item.link,
            video_url: item.link,
            type: "video",
            preview: item.link
          });
        }
      }
    } else if (data.url) {
      media.push({
        url: data.url,
        video_url: data.url,
        type: "video",
        preview: data.url
      });
    }

    if (media.length > 0) {
      return {
        success: true,
        owner: data.author || "instagram_user",
        caption: data.title || "",
        media_type: "video",
        media
      };
    }
  } catch (err: any) {}

  try {
    const resp2 = await axios.get(`https://instagram-downloader-v2.p.rapidapi.com/index`, {
      params: { url: targetUrl },
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "instagram-downloader-v2.p.rapidapi.com"
      },
      timeout: 15000
    });

    const data2 = resp2.data;
    const media2: any[] = [];

    if (Array.isArray(data2.media)) {
      for (const m of data2.media) {
        if (m.url) {
          media2.push({
            url: m.url,
            video_url: m.url,
            type: "video",
            preview: m.preview || m.url
          });
        }
      }
    } else if (data2.url) {
      media2.push({
        url: data2.url,
        video_url: data2.url,
        type: "video",
        preview: data2.url
      });
    }

    if (media2.length > 0) {
      return {
        success: true,
        owner: "instagram_user",
        caption: "",
        media_type: "video",
        media: media2
      };
    }
  } catch (err2: any) {}

  return null;
}

// ===== ENGINE 1: NATIVE INSTAGRAM WEB PROFILE GRAPHQL ENGINE =====
async function fetchInstagramWebProfileReels(usernameInput: string, limit: number = 12) {
  try {
    const cleanUser = cleanInstagramUser(usernameInput);
    if (!cleanUser) return null;

    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${cleanUser}`;
    const resp = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
        'X-ASBD-ID': '129477',
        'X-IG-WWW-Claim': '0',
        'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://www.instagram.com/${cleanUser}/`
      },
      timeout: 12000
    });

    const user = resp.data?.data?.user;
    const timelineEdges = user?.edge_owner_to_timeline_media?.edges || [];
    const felixEdges = user?.edge_felix_video_timeline?.edges || [];
    const allEdges = [...felixEdges, ...timelineEdges];
    const posts: any[] = [];
    const seenIds = new Set<string>();

    for (const edge of allEdges) {
      if (posts.length >= limit) break;
      const node = edge.node;
      const isVideo = node.is_video || false;
      const videoUrl = node.video_url;
      const displayUrl = node.display_url;
      const shortcode = node.shortcode || node.id;

      if (node.edge_sidecar_to_children?.edges?.length > 0) {
        for (const cEdge of node.edge_sidecar_to_children.edges) {
          if (posts.length >= limit) break;
          const cNode = cEdge.node;
          const cId = cNode.shortcode || `${shortcode}_${cNode.id || Date.now()}`;
          if (cNode.is_video && cNode.video_url && !seenIds.has(cId)) {
            seenIds.add(cId);
            posts.push({
              id: cId,
              url: cNode.video_url,
              video_url: cNode.video_url,
              type: "video",
              preview: cNode.display_url || displayUrl
            });
          }
        }
      } else if (isVideo && videoUrl && !seenIds.has(shortcode)) {
        seenIds.add(shortcode);
        posts.push({
          id: shortcode,
          url: videoUrl,
          video_url: videoUrl,
          type: "video",
          preview: displayUrl || videoUrl
        });
      }
    }

    if (posts.length > 0) return posts;
  } catch (err: any) {
    // Fallback: Invoke PHP fetcher if local PHP is available
    try {
      const { execSync } = require('child_process');
      const path = require('path');
      const fs = require('fs');
      const cleanUser = cleanInstagramUser(usernameInput);
      const phpScript = path.resolve(process.cwd(), '..', '..', 'temp-backend', 'fetch_profile.php');
      const altPhpScript = path.resolve(process.cwd(), 'temp-backend', 'fetch_profile.php');
      const targetScript = fs.existsSync(phpScript) ? phpScript : (fs.existsSync(altPhpScript) ? altPhpScript : null);

      if (targetScript && cleanUser) {
        const out = execSync(`php "${targetScript}" "${cleanUser}" ${limit}`, { timeout: 12000 }).toString();
        if (out && out.startsWith('[')) {
          const parsed = JSON.parse(out);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (phpErr: any) {}
  }
  return null;
}

// ===== ENGINE 2: SNAPSAVE HIGH-SPEED UNPACKER =====
function decodeSnapSave(responseJs: string): string | null {
  try {
    const evalIdx = responseJs.indexOf('eval(function(');
    if (evalIdx === -1) return null;
    const prefix = responseJs.slice(0, evalIdx);
    const unpackCall = responseJs.slice(evalIdx + 5, -1);
    const fn = new Function(`${prefix}; return (${unpackCall});`);
    const unpacked = fn();
    return typeof unpacked === 'string' ? unpacked : null;
  } catch (e) {
    return null;
  }
}

async function fetchSnapSave(targetUrl: string) {
  try {
    const resp = await axios.post('https://snapsave.app/action.php', new URLSearchParams({
      url: targetUrl
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Origin': 'https://snapsave.app',
        'Referer': 'https://snapsave.app/'
      },
      timeout: 12000
    });

    const html = decodeSnapSave(resp.data);
    if (!html) return null;

    const cleanHtml = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    const media: any[] = [];

    const matches = [...cleanHtml.matchAll(/href="([^"]+)"/g)];
    for (const match of matches) {
      const mUrl = match[1];
      if (mUrl.includes('rapidcdn') || mUrl.includes('.mp4') || mUrl.includes('cdninstagram') || mUrl.includes('fbcdn')) {
        const isVideo = mUrl.includes('.mp4') || mUrl.includes('snapsave-app') || mUrl.includes('token=') || mUrl.includes('video');
        media.push({
          url: mUrl,
          video_url: mUrl,
          type: isVideo ? 'video' : 'photo',
          preview: mUrl
        });
      }
    }

    if (media.length > 0) {
      return {
        success: true,
        owner: 'instagram_user',
        caption: '',
        media_type: media.length > 1 ? 'carousel' : media[0].type,
        media
      };
    }
  } catch (e) {}
  return null;
}

// ===== ENGINE 3: COBALT MULTI-MEDIA API =====
async function fetchCobalt(url: string) {
  try {
    const resp = await axios.post("https://api.cobalt.liubquanti.click/", { url }, {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      timeout: 10000
    });

    const data = resp.data;
    const media: any[] = [];

    if (data.status === "redirect" && data.url) {
      const isVideo = data.url.includes(".mp4") || data.url.includes("/t50.");
      media.push({
        url: data.url,
        video_url: data.url,
        type: isVideo ? "video" : "photo",
        preview: data.url
      });
    } else if (data.status === "stream" && data.url) {
      media.push({
        url: data.url,
        video_url: data.url,
        type: "video",
        preview: data.url
      });
    } else if (data.status === "picker" && Array.isArray(data.picker)) {
      for (const item of data.picker) {
        if (item.url) {
          const isVideo = item.type === "video" || item.url.includes(".mp4") || item.url.includes("/t50.");
          media.push({
            url: item.url,
            video_url: item.url,
            type: isVideo ? "video" : "photo",
            preview: item.url
          });
        }
      }
    }

    if (media.length > 0) {
      return {
        success: true,
        owner: "instagram_user",
        caption: "",
        media_type: media.length > 1 ? "carousel" : media[0].type,
        media
      };
    }
  } catch (e) {}
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type || "single";
    const rawUrl = body.url || "";
    const rawUsername = body.username || "";
    const limit = parseInt(body.limit || "12", 10);

    const rawInput = rawUrl || rawUsername;
    if (!rawInput) {
      return NextResponse.json({ error: "Please provide a valid Instagram username or link." }, { status: 400 });
    }

    const cleanUser = cleanInstagramUser(rawInput);
    const targetUrl = rawInput.startsWith("http") ? rawInput : `https://www.instagram.com/${cleanUser}/`;

    // Check if RapidAPI Key is provided
    const apiKey = process.env.RAPIDAPI_KEY || process.env.NEXT_PUBLIC_API_KEY;
    const hasValidKey = apiKey && apiKey !== "wp_instasave_rapidapi_key_demo_12345" && apiKey.trim() !== "";

    // 0. Try RapidAPI First if Key is Present
    if (hasValidKey) {
      const rapidRes = await fetchFromRapidAPI(targetUrl, apiKey!);
      if (rapidRes && rapidRes.media?.length > 0) {
        if (type === "bulk-video" || type === "bulk-fetch" || type === "bulk") {
          const posts = rapidRes.media.map((item, idx) => ({
            id: `post_${idx}_${Date.now()}`,
            url: item.url,
            video_url: item.url,
            type: item.type || "video",
            preview: item.preview || item.url
          }));
          return NextResponse.json({ posts });
        }
        if (type === "stories") {
          return NextResponse.json({ stories: rapidRes.media });
        }
        return NextResponse.json(rapidRes);
      }
    }

    // 1. Bulk Profile Video Request
    if (type === "bulk-video" || type === "bulk-fetch" || type === "bulk") {
      const posts = await fetchInstagramWebProfileReels(cleanUser, limit);
      if (posts && posts.length > 0) {
        return NextResponse.json({ posts });
      }

      // Fallback 1: SnapSave on profile page
      const snapProfile = await fetchSnapSave(`https://www.instagram.com/${cleanUser}/`);
      if (snapProfile?.media?.length) {
        const mapped = snapProfile.media.map((item: any, idx: number) => ({
          id: `snap_${idx}_${Date.now()}`,
          url: item.url,
          video_url: item.url,
          type: item.type || "video",
          preview: item.preview || item.url
        }));
        return NextResponse.json({ posts: mapped });
      }

      // Fallback 2: Cobalt
      const cobaltProfile = await fetchCobalt(`https://www.instagram.com/${cleanUser}/reels/`);
      if (cobaltProfile?.media?.length) {
        const mapped = cobaltProfile.media.map((item: any, idx: number) => ({
          id: `reel_${idx}_${Date.now()}`,
          url: item.url,
          video_url: item.url,
          type: item.type || "video",
          preview: item.url
        }));
        return NextResponse.json({ posts: mapped });
      }
    }

    // 2. Stories Request
    if (type === "stories") {
      const snapStories = await fetchSnapSave(`https://www.instagram.com/stories/${cleanUser}/`);
      if (snapStories?.media?.length) {
        return NextResponse.json({ stories: snapStories.media });
      }

      const cobaltStories = await fetchCobalt(`https://www.instagram.com/stories/${cleanUser}/`);
      if (cobaltStories?.media?.length) {
        const stories = cobaltStories.media.map((item: any, idx: number) => ({
          id: `story_${idx}_${Date.now()}`,
          url: item.url,
          video_url: item.url,
          type: item.type || "video",
          preview: item.url
        }));
        return NextResponse.json({ stories });
      }
    }

    // 3. Single Reel / Video Request
    const singleUrl = rawInput.startsWith("http") ? rawInput : `https://www.instagram.com/reel/${cleanUser}/`;

    // Engine A: SnapSave
    const snapResult = await fetchSnapSave(singleUrl);
    if (snapResult && snapResult.media?.length > 0) {
      return NextResponse.json(snapResult);
    }

    // Engine B: Web Profile single item
    const profileSingle = await fetchInstagramWebProfileReels(cleanUser, 1);
    if (profileSingle && profileSingle.length > 0) {
      return NextResponse.json({
        success: true,
        owner: cleanUser,
        caption: "",
        media_type: "video",
        media: profileSingle
      });
    }

    // Engine C: Cobalt
    const cobaltResult = await fetchCobalt(singleUrl);
    if (cobaltResult) {
      return NextResponse.json(cobaltResult);
    }

    return NextResponse.json({
      error: "Could not fetch Instagram video. Please verify the username or link is valid and public."
    }, { status: 422 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}
