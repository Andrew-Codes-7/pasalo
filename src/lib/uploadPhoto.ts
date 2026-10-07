"use client";

import { createClient } from "./supabase/client";

/**
 * Shrinks a photo in the browser, then uploads it to Supabase Storage.
 *
 * Resizing client-side matters here more than usual: phone photos are
 * routinely 4-6MB, the storage bucket caps uploads at 5MB, and half this
 * community is on mobile data. A 1600px JPEG is plenty for a listing and
 * uploads in a fraction of the time.
 *
 * Files land under a folder named after the uploader, which is what the
 * storage policy checks — nobody can write into anyone else's folder.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.82;

export type UploadResult =
  | { ok: true; path: string; publicUrl: string; accent: string }
  | { ok: false; error: string };

/**
 * Average colour of the image, darkened, for the gradient on the browse card.
 * Sampled here because the canvas already exists — doing it later would mean
 * decoding the photo a second time.
 */
function sampleAccent(ctx: CanvasRenderingContext2D, w: number, h: number): string {
  try {
    const { data } = ctx.getImageData(0, 0, w, h);
    let r = 0, g = 0, b = 0, n = 0;
    // Every 40th pixel is plenty and keeps this instant on a phone.
    for (let i = 0; i < data.length; i += 4 * 40) {
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
    if (!n) return "#4a5560";
    const dim = 0.55; // darkened so white text stays readable on top
    const hex = (v: number) =>
      Math.round((v / n) * dim).toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch {
    return "#4a5560";
  }
}

async function shrink(file: File): Promise<{ blob: Blob; accent: string }> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: file, accent: "#4a5560" };
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const accent = sampleAccent(ctx, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  return { blob: blob ?? file, accent };
}

export async function uploadListingPhoto(file: File): Promise<UploadResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be signed in to add photos." };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "That file isn't an image." };
  }

  let body: Blob;
  let accent = "#4a5560";
  try {
    const shrunk = await shrink(file);
    body = shrunk.blob;
    accent = shrunk.accent;
  } catch {
    // Some formats (HEIC on older browsers) cannot be decoded to a canvas.
    // Fall back to the original and let the bucket's size limit decide.
    body = file;
  }

  if (body.size > 5 * 1024 * 1024) {
    return { ok: false, error: "That photo is too large, even after shrinking." };
  }

  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("listing-photos")
    .upload(path, body, { contentType: "image/jpeg", upsert: false });

  if (error) return { ok: false, error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("listing-photos").getPublicUrl(path);

  return { ok: true, path, publicUrl, accent };
}

export async function deleteListingPhoto(path: string) {
  const supabase = createClient();
  await supabase.storage.from("listing-photos").remove([path]);
}
