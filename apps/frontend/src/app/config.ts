import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.thecalicocats.com';

export async function requestDownloaderApi(payload: any) {
  let lastError: any = null;

  // 1. Try configured API_BASE_URL first
  if (API_BASE_URL && API_BASE_URL.trim() !== '') {
    try {
      const endpoint = `${API_BASE_URL.replace(/\/$/, '')}/api/download`;
      const resp = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      if (resp.data && (resp.data.posts || resp.data.stories || resp.data.media || resp.data.success)) {
        return resp.data;
      }
    } catch (err: any) {
      lastError = err;
      console.warn("Primary API endpoint failed, trying local fallback:", err.message);
    }
  }

  // 2. Failover to Next.js internal /api/download
  try {
    const localResp = await axios.post('/api/download', payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    if (localResp.data && (localResp.data.posts || localResp.data.stories || localResp.data.media || localResp.data.success)) {
      return localResp.data;
    }
    return localResp.data;
  } catch (localErr: any) {
    throw lastError || localErr;
  }
}
