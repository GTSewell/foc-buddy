import { optimize } from "svgo";
import { gzip } from "pako";

export type MediaMeta = {
  mime: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number; // seconds for video
  isSvg: boolean;
  gzipBytes?: number;
};

export async function readFileBytes(file: File): Promise<Uint8Array> {
  const ab = await file.arrayBuffer();
  return new Uint8Array(ab);
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

export async function getVideoMeta(file: File): Promise<{ width: number; height: number; duration: number } | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const meta = { width: video.videoWidth, height: video.videoHeight, duration: video.duration };
      URL.revokeObjectURL(url);
      resolve(meta);
    };
    video.onerror = () => resolve(undefined);
    video.src = url;
  });
}

export function detectIsSvg(file: File): boolean {
  return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
}

export async function minifySvgIfNeeded(file: File, enabled: boolean): Promise<Uint8Array | null> {
  if (!enabled) return null;
  if (!detectIsSvg(file)) return null;
  const text = await file.text();
  const res = optimize(text, { multipass: true });
  const out = typeof res === "string" ? res : (res as any).data;
  return new TextEncoder().encode(out);
}

export function gzipSize(bytes: Uint8Array): number {
  try {
    const gz = gzip(bytes);
    return gz.length;
  } catch {
    return 0;
  }
}

export async function buildMediaMeta(file: File, data: Uint8Array): Promise<MediaMeta> {
  const isSvg = detectIsSvg(file);
  let width: number | undefined, height: number | undefined, duration: number | undefined;
  if (file.type.startsWith("image/") && !file.type.includes("svg")) {
    const dims = await getImageDimensions(file);
    width = dims?.width; height = dims?.height;
  } else if (file.type === "image/svg+xml") {
    // SVG has no intrinsic pixel dimensions unless specified; ignore
  } else if (file.type === "video/mp4") {
    const meta = await getVideoMeta(file);
    width = meta?.width; height = meta?.height; duration = meta?.duration;
  }
  const gzipBytes = gzipSize(data);
  return { mime: file.type || "", bytes: data.length, width, height, duration, isSvg, gzipBytes };
}
