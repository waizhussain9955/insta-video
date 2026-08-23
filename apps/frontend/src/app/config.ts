import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.thecalicocats.com';

export function getProxyUrl(url: string, format: string = ''): string {
  const base = (API_BASE_URL && API_BASE_URL.trim() !== '') ? API_BASE_URL.replace(/\/$/, '') : '';
  const fmt = format ? `&format=${encodeURIComponent(format)}` : '';
  return `${base}/api/proxy?url=${encodeURIComponent(url)}${fmt}`;
}

export async function requestDownloaderApi(payload: any) {
  let lastError: any = null;

  // 1. Try Next.js local /api/download first (instant response)
  try {
    const localResp = await axios.post('/api/download', payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    if (localResp.data && (localResp.data.posts || localResp.data.stories || localResp.data.media || localResp.data.success)) {
      return localResp.data;
    }
  } catch (localErr: any) {
    lastError = localErr;
    console.warn("Local /api/download failed, trying configured API_BASE_URL:", localErr.message);
  }

  // 2. Fallback to configured API_BASE_URL if different from local
  if (API_BASE_URL && API_BASE_URL.trim() !== '') {
    try {
      const endpoint = `${API_BASE_URL.replace(/\/$/, '')}/api/download`;
      const resp = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      });
      if (resp.data && (resp.data.posts || resp.data.stories || resp.data.media || resp.data.success)) {
        return resp.data;
      }
      return resp.data;
    } catch (err: any) {
      throw err || lastError;
    }
  }

  throw lastError || new Error("Failed to connect to downloader API.");
}
