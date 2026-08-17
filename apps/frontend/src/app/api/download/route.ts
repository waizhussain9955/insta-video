import { NextResponse } from "next/server";
import instagramUrlDirect from "instagram-url-direct";
const { instagramGetUrl } = instagramUrlDirect;
import axios from "axios";

// ===== SnapSave.app Scraper (keyless fallback) =====
function convertBase(d: string, e: number, f: number): string {
  const g = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
  const h = g.slice(0, e);
  const i = g.slice(0, f);
  const j = d.split('').reverse().reduce((acc: number, b: string, c: number) => {
    const index = h.indexOf(b);
    return index !== -1 ? acc + index * Math.pow(e, c) : acc;
  }, 0);
  let k = "";
  let temp = j;
  while (temp > 0) {
    k = i[temp % f] + k;
    temp = Math.floor(temp / f);
  }
  return k || "0";
}

function deobfuscate(h: string, n: string, t: number, e: number): string {
  let r = "";
  let i = 0;
  while (i < h.length) {
    let s = "";
    while (i < h.length && h[i] !== n[e]) {
      s += h[i];
      i++;
    }
    s = s.split('').map(c => n.indexOf(c)).join('');
    r += String.fromCharCode(parseInt(convertBase(s, e, 10)) - t);
    i++;
  }
  return r;
}

async function snapSaveScrape(url: string): Promise<{ media: Array<{ url: string; type: string }> }> {
  const resp = await axios.post('https://snapsave.app/action.php',
    new URLSearchParams({ url }).toString(),
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://snapsave.app/',
        'Origin': 'https://snapsave.app',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 20000
    }
  );

  const jsCode = resp.data;
  if (!jsCode || jsCode.length === 0) throw new Error("Empty response from SnapSave");

  const pattern = /\("(\w+)",\s*(\d+),\s*"(\w+)",\s*(\d+),\s*(\d+),\s*\d+\)/;
  const matches = jsCode.match(pattern);
  if (!matches) throw new Error("Could not decode SnapSave response");

  const [, encoded, , charset, shiftStr, radixStr] = matches;
  const decoded = deobfuscate(encoded, charset, parseInt(shiftStr), parseInt(radixStr));

  if (decoded.includes("error_api") || decoded.includes("Unable to connect")) {
    throw new Error("SnapSave could not fetch this content from Instagram");
  }

  const unescaped = decoded
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\//g, '/')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');

  const results: Array<{ url: string; type: string }> = [];

  // Extract rapidcdn download links
  const rapidcdnPattern = /https:\/\/d\.rapidcdn\.app\/v2\?token=[^"\\&\s]+/g;
  const rapidLinks = unescaped.match(rapidcdnPattern) || [];
  for (const link of rapidLinks) {
    const cleanLink = link.replace(/&amp;/g, '&');
    const isVideo = cleanLink.includes('.mp4') || unescaped.includes('icon-dlvideo');
    results.push({ url: cleanLink, type: isVideo ? 'video' : 'image' });
  }

  // Also try to extract direct CDN links
  if (results.length === 0) {
    const cdnPattern = /https?:\/\/[^\s"'<>\\]*(?:fbcdn|cdninstagram|scontent)[^\s"'<>\\]*/g;
    const cdnLinks = unescaped.match(cdnPattern) || [];
    for (const link of cdnLinks) {
      const cleanLink = link.replace(/\\\//g, '/');
      results.push({
        url: cleanLink,
        type: cleanLink.includes('.mp4') ? 'video' : 'image'
      });
    }
  }

  return { media: results };
}

// ===== Cobalt.liubquanti.click Scraper (keyless fallback) =====
async function cobaltScrape(url: string): Promise<{ media: Array<{ url: string; type: string }> }> {
  const resp = await axios.post('https://api.cobalt.liubquanti.click/', 
    { url },
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );
  const data = resp.data;
  if (data.status === 'redirect' && data.url) {
    const isVideo = data.url.includes('.mp4') || (data.filename && data.filename.endsWith('.mp4'));
    return {
      media: [{ url: data.url, type: isVideo ? 'video' : 'image' }]
    };
  } else if (data.status === 'stream' && data.url) {
    return {
      media: [{ url: data.url, type: 'video' }]
    };
  } else if (data.status === 'picker' && Array.isArray(data.picker)) {
    const media = data.picker.map((item: any) => ({
      url: item.url,
      type: item.type === 'video' ? 'video' : 'image'
    })).filter((item: any) => item.url);
    return { media };
  }
  throw new Error(`Unsupported Cobalt status: ${data.status}`);
}

// ===== Bulk Profile Scraper (keyless, uses Instagram GraphQL) =====
async function fetchProfilePosts(username: string, limit: number = 12): Promise<any[]> {
  try {
    // Step 1: Get user ID from profile page
    const profileUrl = `https://www.instagram.com/${username}/`;
    const profileResp = await axios.get(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000
    });

    // Extract user_id from the page source
    const userIdMatch = profileResp.data.match(/"user_id":"(\d+)"/);
    if (!userIdMatch) {
      throw new Error("Could not find user ID. Profile may be private or doesn't exist.");
    }
    const userId = userIdMatch[1];

    // Step 2: Get CSRF token
    const csrfCookie = profileResp.headers['set-cookie'];
    let csrfToken = '';
    if (csrfCookie) {
      const cookieArr = Array.isArray(csrfCookie) ? csrfCookie : [csrfCookie];
      for (const cookie of cookieArr) {
        if (cookie.includes('csrftoken=')) {
          csrfToken = cookie.split('csrftoken=')[1]?.split(';')[0] || '';
          break;
        }
      }
    }

    // Step 3: Fetch posts using GraphQL
    const POSTS_DOC_ID = "17991233890457762"; // Instagram's edge_owner_to_timeline_media doc_id
    const variables = JSON.stringify({
      id: userId,
      first: Math.min(limit, 50),
      after: null
    });

    const graphqlResp = await axios.post('https://www.instagram.com/graphql/query', 
      new URLSearchParams({
        doc_id: POSTS_DOC_ID,
        variables: variables
      }).toString(),
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 15000
      }
    );

    const data = graphqlResp.data;
    const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges || 
                  data?.data?.xdt_api__v1__feed__user_timeline_graphql_connection?.edges || [];

    const posts = edges.slice(0, limit).map((edge: any, idx: number) => {
      const node = edge.node;
      const isVideo = node.is_video;
      const mediaUrl = isVideo ? (node.video_url || node.display_url) : node.display_url;
      return {
        id: node.shortcode || `post_${idx}_${Date.now()}`,
        url: mediaUrl,
        type: isVideo ? 'video' : 'image',
        preview: node.thumbnail_src || node.display_url
      };
    });

    return posts;
  } catch (err: any) {
    throw new Error(`Failed to fetch profile posts: ${err.message}`);
  }
}

// Helper to query RapidAPI
async function fetchFromRapidAPI(targetUrl: string, apiKey: string, apiHost: string) {
  const apiEndpoint = `https://${apiHost}/instagram?url=${encodeURIComponent(targetUrl)}`;
  const response = await fetch(apiEndpoint, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": apiHost,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Third-party API returned status ${response.status}: ${errorText || "Unknown error"}`);
  }

  const data = await response.json();
  const success = data.success || data.status === "success" || Array.isArray(data.media) || Array.isArray(data.result);
  if (!success) {
    throw new Error(data.message || "Failed to extract media details. Make sure the content is public.");
  }

  const rawMedia = data.media || data.result || [];
  const mediaItems = Array.isArray(rawMedia) 
    ? rawMedia.map((m: any) => ({
        url: m.url || m.downloadUrl || m.link || "",
        type: m.type === "video" || m.isVideo || (m.url && m.url.includes(".mp4")) ? "video" : "image"
      })).filter((item: any) => item.url !== "")
    : [];

  if (mediaItems.length === 0 && data.url) {
    mediaItems.push({
      url: data.url,
      type: data.type === "video" || (data.url && data.url.includes(".mp4")) ? "video" : "image"
    });
  }

  if (mediaItems.length === 0) {
    throw new Error("No downloadable media items found in the response");
  }

  const caption = data.caption || data.title || "";
  const owner = data.owner || data.username || "instagram_user";

  return { mediaItems, caption, owner };
}

// ===== Main API Handler =====
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, url, username, limit } = body;

    // Validate inputs
    let targetUrl = "";
    if (type === "single") {
      if (!url || !url.startsWith("http")) {
        return NextResponse.json({ error: "Invalid Instagram URL format" }, { status: 400 });
      }
      targetUrl = url;
    } else if (type === "stories") {
      if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
      }
      targetUrl = username.startsWith("http") ? username : `https://www.instagram.com/stories/${username}/`;
    } else if (type === "bulk-fetch") {
      if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
      }
      targetUrl = username.startsWith("http") ? username : `https://www.instagram.com/${username}/`;
    } else {
      return NextResponse.json({ error: "Unsupported download type" }, { status: 400 });
    }

    // Load credentials from environment
    const apiKey = process.env.RAPIDAPI_KEY || process.env.NEXT_PUBLIC_API_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || "social-media-video-downloader.p.rapidapi.com";
    const hasValidKey = apiKey && apiKey !== "wp_instasave_rapidapi_key_demo_12345" && apiKey.trim() !== "";

    // ===== Handle stories downloads =====
    if (type === "stories") {
      if (!hasValidKey) {
        return NextResponse.json({ 
          error: "⚠️ Instagram Stories require authentication to access. Instagram blocks all anonymous story requests — no keyless API or public scraper can bypass this. However, you can subscribe to the 100% FREE plan ($0/month) of the RapidAPI 'Instagram Downloader' (by social-media-video-downloader) to enable this feature at no cost. Subscribe on RapidAPI, then add your key to apps/frontend/.env.local (e.g., RAPIDAPI_KEY=your_key)." 
        }, { status: 422 });
      }

      try {
        const { mediaItems } = await fetchFromRapidAPI(targetUrl, apiKey!, apiHost);
        const stories = mediaItems.map((item) => ({
          url: item.url,
          type: item.type,
          preview: item.url
        }));
        return NextResponse.json({ stories });
      } catch (err: any) {
        let errorMsg = err.message;
        if (errorMsg.includes("403") || errorMsg.includes("subscribed")) {
          errorMsg = "⚠️ Your RapidAPI Key is valid, but you are not subscribed to the free plan. Please open the RapidAPI page for 'Instagram Downloader' (by social-media-video-downloader), go to the 'Pricing' tab, and subscribe to the Basic ($0/month) free plan. This will activate your key immediately for free!";
        }
        return NextResponse.json({ error: errorMsg }, { status: 422 });
      }
    }

    // ===== Handle bulk profile downloads =====
    if (type === "bulk-fetch") {
      if (hasValidKey) {
        try {
          const { mediaItems } = await fetchFromRapidAPI(targetUrl, apiKey!, apiHost);
          const posts = mediaItems.slice(0, limit || 12).map((item, idx) => ({
            id: `post_${idx}_${Date.now()}`,
            url: item.url,
            type: item.type,
            preview: item.url
          }));
          return NextResponse.json({ posts });
        } catch (err: any) {
          console.log(`RapidAPI bulk download failed (${err.message}), trying keyless fallbacks...`);
          let errorMsg = err.message;
          if (errorMsg.includes("403") || errorMsg.includes("subscribed")) {
            errorMsg = "⚠️ Your RapidAPI Key is valid, but you are not subscribed to the free plan. Please open the RapidAPI page for 'Instagram Downloader' (by social-media-video-downloader), go to the 'Pricing' tab, and subscribe to the Basic ($0/month) free plan. This will activate your key immediately for free!";
            return NextResponse.json({ error: errorMsg }, { status: 422 });
          }
        }
      }

      // Keyless bulk fetch fallback
      try {
        const posts = await fetchProfilePosts(username, limit || 12);
        if (posts.length === 0) {
          return NextResponse.json({ error: "No public posts found for this profile. The account may be private." }, { status: 422 });
        }
        return NextResponse.json({ posts });
      } catch (bulkErr: any) {
        // Fallback: try fetching the profile page and extract post shortcodes, then use keyless single downloaders
        try {
          const profileResp = await axios.get(`https://www.instagram.com/${username}/`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            timeout: 15000
          });
          
          const shortcodePattern = /"shortcode":"([A-Za-z0-9_-]+)"/g;
          const shortcodes: string[] = [];
          let match;
          while ((match = shortcodePattern.exec(profileResp.data)) !== null) {
            if (!shortcodes.includes(match[1])) {
              shortcodes.push(match[1]);
            }
          }
          
          if (shortcodes.length === 0) {
            return NextResponse.json({ 
              error: `Could not fetch profile posts: ${bulkErr.message}. For reliable profile downloads, please configure a valid RapidAPI Key in apps/frontend/.env.local.` 
            }, { status: 422 });
          }

          const selectedShortcodes = shortcodes.slice(0, limit || 12);
          const posts = [];
          
          for (let i = 0; i < selectedShortcodes.length; i++) {
            try {
              const postUrl = `https://www.instagram.com/p/${selectedShortcodes[i]}/`;
              const result = await instagramGetUrl(postUrl);
              if (result && result.url_list && result.url_list.length > 0) {
                const mediaUrl = result.url_list[0];
                const isVideo = result.media_details?.[0]?.type === "video" || mediaUrl.includes('.mp4');
                const thumbnail = result.media_details?.[0]?.thumbnail || result.url_list[0];
                posts.push({
                  id: selectedShortcodes[i],
                  url: mediaUrl,
                  type: isVideo ? 'video' : 'image',
                  preview: thumbnail
                });
              }
            } catch {
              // Skip failed posts
            }
          }

          if (posts.length === 0) {
            return NextResponse.json({ error: "Could not resolve any posts from this profile. A RapidAPI Key is recommended." }, { status: 422 });
          }

          return NextResponse.json({ posts });
        } catch (fallbackErr: any) {
          return NextResponse.json({ 
            error: `Bulk download failed: ${bulkErr.message}. A RapidAPI Key is recommended for reliable bulk profile downloads.` 
          }, { status: 422 });
        }
      }
    }

    // ===== Handle single downloads =====
    if (type === "single") {
      // If a valid key is provided, try RapidAPI first
      if (hasValidKey) {
        try {
          const { mediaItems, caption, owner } = await fetchFromRapidAPI(targetUrl, apiKey!, apiHost);
          return NextResponse.json({
            success: true,
            owner,
            caption,
            media_type: mediaItems.length > 1 ? "carousel" : mediaItems[0]?.type || "video",
            media: mediaItems
          });
        } catch (err: any) {
          console.log(`RapidAPI single download failed (${err.message}), trying keyless fallbacks...`);
        }
      }

      // Keyless fallback 1: instagram-url-direct (uses Instagram's GraphQL)
      try {
        const result = await instagramGetUrl(targetUrl);
        if (!result || !result.url_list || result.url_list.length === 0) {
          throw new Error("No media resolved");
        }

        const mediaItems = (result.media_details || []).map((m: any) => ({
          url: m.url || "",
          type: m.type === "video" ? "video" : "image"
        })).filter((item: any) => item.url !== "");

        // Fallback to url_list if media_details format fails
        if (mediaItems.length === 0 && result.url_list && result.url_list.length > 0) {
          result.url_list.forEach((u: string) => {
            mediaItems.push({
              url: u,
              type: u.includes(".mp4") ? "video" : "image"
            });
          });
        }

        const caption = result.post_info?.caption || "";
        const owner = result.post_info?.owner_username || "instagram_user";

        return NextResponse.json({
          success: true,
          owner,
          caption,
          media_type: mediaItems.length > 1 ? "carousel" : mediaItems[0]?.type || "video",
          media: mediaItems
        });
      } catch (primaryErr: any) {
        console.log(`Primary keyless scraper failed (${primaryErr.message}), trying SnapSave fallback...`);
        
        // Keyless fallback 2: SnapSave.app scraper
        try {
          const snapResult = await snapSaveScrape(targetUrl);
          if (snapResult.media.length === 0) {
            throw new Error("No downloadable media found via SnapSave");
          }

          return NextResponse.json({
            success: true,
            owner: "instagram_user",
            caption: "",
            media_type: snapResult.media.length > 1 ? "carousel" : snapResult.media[0]?.type || "video",
            media: snapResult.media
          });
        } catch (fallbackErr: any) {
          console.log(`SnapSave fallback failed (${fallbackErr.message}), trying Cobalt fallback...`);

          // Keyless fallback 3: Cobalt scraper
          try {
            const cobaltResult = await cobaltScrape(targetUrl);
            if (cobaltResult.media.length === 0) {
              throw new Error("No downloadable media found via Cobalt");
            }

            return NextResponse.json({
              success: true,
              owner: "instagram_user",
              caption: "",
              media_type: cobaltResult.media.length > 1 ? "carousel" : cobaltResult.media[0]?.type || "video",
              media: cobaltResult.media
            });
          } catch (cobaltErr: any) {
            return NextResponse.json({ 
              error: `Download failed. Tried primary scraper (${primaryErr.message}), SnapSave (${fallbackErr.message}), and Cobalt (${cobaltErr.message}).` 
            }, { status: 422 });
          }
        }
      }
    }

    return NextResponse.json({ error: "Invalid type flow reached" }, { status: 500 });

  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "API connection timed out after 30 seconds" }, { status: 504 });
    }
    return NextResponse.json({ error: `Internal Server Error: ${err.message}` }, { status: 500 });
  }
}
