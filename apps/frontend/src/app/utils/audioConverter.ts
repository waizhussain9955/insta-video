import { Mp3Encoder } from "@breezystack/lamejs";

/**
 * High-Performance Client-Side Audio Extractor & 320kbps MP3 Encoder
 * Converts any Instagram MP4/video/audio stream into 100% genuine MP3 audio.
 */

export async function convertMediaUrlToMp3Blob(
  mediaUrl: string,
  onProgress?: (status: string) => void
): Promise<{ blob: Blob; hasAudio: boolean }> {
  onProgress?.("Fetching media stream...");
  
  const response = await fetch(mediaUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch media stream (Status ${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();

  onProgress?.("Extracting audio channels...");
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in your browser.");
  }

  const audioCtx = new AudioContextClass();
  let audioBuffer: AudioBuffer;

  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } catch (err: any) {
    audioCtx.close();
    throw new Error("This Instagram video has no audio track (it is silent or muted).");
  }

  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;

  if (numChannels === 0 || length === 0) {
    audioCtx.close();
    throw new Error("No audible sound channels found in this media.");
  }

  onProgress?.("Encoding studio 320kbps MP3...");

  const channels = numChannels > 1 ? 2 : 1;
  const mp3encoder = new Mp3Encoder(channels, sampleRate, 320);
  const mp3Data: Uint8Array[] = [];

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = numChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

  const sampleBlockSize = 1152;
  const leftInt16 = new Int16Array(sampleBlockSize);
  const rightInt16 = new Int16Array(sampleBlockSize);

  for (let i = 0; i < length; i += sampleBlockSize) {
    const chunkLength = Math.min(sampleBlockSize, length - i);
    for (let j = 0; j < chunkLength; j++) {
      const l = Math.max(-1, Math.min(1, leftChannel[i + j]));
      leftInt16[j] = l < 0 ? l * 0x8000 : l * 0x7fff;

      const r = Math.max(-1, Math.min(1, rightChannel[i + j]));
      rightInt16[j] = r < 0 ? r * 0x8000 : r * 0x7fff;
    }

    let mp3buf: Uint8Array;
    if (channels === 2) {
      mp3buf = mp3encoder.encodeBuffer(
        chunkLength === sampleBlockSize ? leftInt16 : leftInt16.subarray(0, chunkLength),
        chunkLength === sampleBlockSize ? rightInt16 : rightInt16.subarray(0, chunkLength)
      );
    } else {
      mp3buf = mp3encoder.encodeBuffer(
        chunkLength === sampleBlockSize ? leftInt16 : leftInt16.subarray(0, chunkLength)
      );
    }

    if (mp3buf && mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const endBuf = mp3encoder.flush();
  if (endBuf && endBuf.length > 0) {
    mp3Data.push(new Uint8Array(endBuf));
  }

  audioCtx.close();

  const mp3Blob = new Blob(mp3Data as BlobPart[], { type: "audio/mp3" });
  return { blob: mp3Blob, hasAudio: true };
}

/**
 * Triggers instant browser file download for a Blob
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename.endsWith(".mp3") ? filename : `${filename}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
}
