import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { db } from './db';

export interface StoredPhoto {
  url: string; // full version, opened when a wall thumbnail is clicked
  thumbUrl: string; // ~640px webp for the wall grid
  thumb: Buffer; // thumbnail bytes, reused for AI verify (cheaper than full size)
}

// Blob, not Buffer: raw Buffers get UTF-8-mangled somewhere in the upload path on Vercel.
async function upload(path: string, bytes: Buffer, mime: string): Promise<string> {
  const { error } = await db.storage
    .from('photos')
    .upload(path, new Blob([new Uint8Array(bytes)], { type: mime }), { contentType: mime });
  if (error) throw error;
  return db.storage.from('photos').getPublicUrl(path).data.publicUrl;
}

function thumbnail(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes)
    .rotate()
    .resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();
}

// Download a Telegram photo by file_id and store two versions: the untouched
// Telegram file (Telegram already compressed it) + a wall thumbnail.
export async function storeTelegramPhoto(fileId: string): Promise<StoredPhoto> {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const fileJson = await fileRes.json();
  const filePath = fileJson.result.file_path as string;
  const raw = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  const original = Buffer.from(await raw.arrayBuffer());

  const id = randomUUID();
  const ext = filePath.split('.').pop() ?? 'jpg';
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const thumb = await thumbnail(original);
  const [url, thumbUrl] = await Promise.all([
    upload(`${id}.${ext}`, original, mime),
    upload(`${id}-thumb.webp`, thumb, 'image/webp'),
  ]);
  return { url, thumbUrl, thumb };
}

// Browser upload straight off a phone camera (3-12MB): nothing compressed it for
// us, so the "full" version is capped at 1600px to protect the storage budget.
export async function storeUploadedPhoto(bytes: Buffer): Promise<StoredPhoto> {
  const id = randomUUID();
  const full = await sharp(bytes)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const thumb = await thumbnail(full);
  const [url, thumbUrl] = await Promise.all([
    upload(`${id}.webp`, full, 'image/webp'),
    upload(`${id}-thumb.webp`, thumb, 'image/webp'),
  ]);
  return { url, thumbUrl, thumb };
}

// Fetch an already-stored photo (e.g. a guest reference photo) as a buffer for AI verify.
export async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}
