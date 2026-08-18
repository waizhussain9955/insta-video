import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");
  const format = (searchParams.get("format") || "").toLowerCase();

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return new Response("Missing or invalid target media URL", { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch media from source: status ${response.status}`, {
        status: response.status,
      });
    }

    const headers: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400",
    };

    if (format === "mp3" || format === "audio") {
      headers["Content-Type"] = "audio/mpeg";
      headers["Content-Disposition"] = `attachment; filename="instagram_audio_${Date.now()}.mp3"`;
    } else if (targetUrl.includes(".mp4") || format === "video") {
      headers["Content-Type"] = "video/mp4";
      headers["Content-Disposition"] = `attachment; filename="instagram_video_${Date.now()}.mp4"`;
    } else {
      headers["Content-Type"] = response.headers.get("content-type") || "application/octet-stream";
    }

    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new Response(`Proxy Error: ${err.message}`, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
