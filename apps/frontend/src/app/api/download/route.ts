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

// ===== ENGINE 0: MANAGED RAPIDAPI ENGINE (100% RELIABLE, ZERO 429 BLOCKS) =====
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
  } catch (err: any) {
    console.error("RapidAPI Error:", err.message);
  }
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-IG-App-ID': '936619743392459',
        'X-ASBD-ID': '129477',
        'X-IG-WWW-Claim': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://www.instagram.com',
        'Referer': `https://www.instagram.com/${cleanUser}/`
      },
      timeout: 10000
    });

    const user = resp.data?.data?.user;
    const edges = user?.edge_owner_to_timeline_media?.edges || [];
    const posts: any[] = [];

    for (const edge of edges) {
      if (posts.length >= limit) break;
      const node = edge.node;
      const isVideo = node.is_video || false;
      const videoUrl = node.video_url;
      const displayUrl = node.display_url;
      const shortcode = node.shortcode;

      if (node.edge_sidecar_to_children?.edges?.length > 0) {
        for (const cEdge of node.edge_sidecar_to_children.edges) {
          if (posts.length >= limit) break;
          const cNode = cEdge.node;
          if (cNode.is_video && cNode.video_url) {
            posts.push({
              id: cNode.shortcode || `${shortcode}_${cNode.id || Date.now()}`,
              url: cNode.video_url,
              video_url: cNode.video_url,
              type: "video",
              preview: cNode.display_url || displayUrl
            });
          }
        }
      } else if (isVideo && videoUrl) {
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
    console.error("Web Profile API error:", err.message);
  }
  return null;
}

// ===== ENGINE 2: COBALT MULTI-MEDIA API =====
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
      if (isVideo) {
        media.push({
          url: data.url,
          video_url: data.url,
          type: "video"
        });
      }
    } else if (data.status === "stream" && data.url) {
      media.push({
        url: data.url,
        video_url: data.url,
        type: "video"
      });
    } else if (data.status === "picker" && Array.isArray(data.picker)) {
      for (const item of data.picker) {
        if (item.url) {
          const isVideo = item.type === "video" || item.url.includes(".mp4") || item.url.includes("/t50.");
          if (isVideo) {
            media.push({
              url: item.url,
              video_url: item.url,
              type: "video"
            });
          }
        }
      }
    }

    if (media.length > 0) {
      return {
        success: true,
        owner: "instagram_user",
        caption: "",
        media_type: "video",
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
            type: "video",
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

      // Fallback to Cobalt
      const cobaltProfile = await fetchCobalt(`https://www.instagram.com/${cleanUser}/reels/`);
      if (cobaltProfile?.media?.length) {
        const mapped = cobaltProfile.media.map((item: any, idx: number) => ({
          id: `reel_${idx}_${Date.now()}`,
          url: item.url,
          video_url: item.url,
          type: "video",
          preview: item.url
        }));
        return NextResponse.json({ posts: mapped });
      }
    }

    // 2. Stories Request
    if (type === "stories") {
      const cobaltStories = await fetchCobalt(`https://www.instagram.com/stories/${cleanUser}/`);
      if (cobaltStories?.media?.length) {
        const stories = cobaltStories.media.map((item: any, idx: number) => ({
          id: `story_${idx}_${Date.now()}`,
          url: item.url,
          video_url: item.url,
          type: "video",
          preview: item.url
        }));
        return NextResponse.json({ stories });
      }
    }

    // 3. Single Reel / Video Request
    const singleUrl = rawInput.startsWith("http") ? rawInput : `https://www.instagram.com/reel/${cleanUser}/`;
    const singleResult = await fetchCobalt(singleUrl);
    if (singleResult) {
      return NextResponse.json(singleResult);
    }

    return NextResponse.json({
      error: "Could not fetch Instagram video. Please verify the username or link is valid and public."
    }, { status: 422 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}
