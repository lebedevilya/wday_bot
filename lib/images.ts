import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { db } from './db';

export interface StoredPhoto {
  url: string; // full version — Telegram's own compression, stored as-is
  thumbUrl: string; // ~640px webp for the wall grid
  buffer: Buffer; // full bytes, reused for AI verify
  mime: string;
}

// Download a Telegram photo by file_id and store two versions:
// the untouched Telegram file (full) + a small webp thumbnail (wall grid).
export async function storeTelegramPhoto(fileId: string): Promise<StoredPhoto> {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const fileJson = await fileRes.json();
  const filePath = fileJson.result.file_path as string;
  const raw = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  const original = Buffer.from(await raw.arrayBuffer());

  const thumb = await sharp(original)
    .rotate()
    .resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();

  const id = randomUUID();
  const ext = filePath.split('.').pop() ?? 'jpg';
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const [full, small] = await Promise.all([
    db.storage.from('photos').upload(`${id}.${ext}`, original, { contentType: mime }),
    db.storage.from('photos').upload(`${id}-thumb.webp`, thumb, { contentType: 'image/webp' }),
  ]);
  if (full.error) throw full.error;
  if (small.error) throw small.error;
  return {
    url: db.storage.from('photos').getPublicUrl(`${id}.${ext}`).data.publicUrl,
    thumbUrl: db.storage.from('photos').getPublicUrl(`${id}-thumb.webp`).data.publicUrl,
    buffer: original,
    mime,
  };
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
