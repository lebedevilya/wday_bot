import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { db } from './db';

// Download a Telegram photo by file_id, compress to webp (~300-500KB), upload to
// the public 'photos' bucket. Returns { url, buffer } (buffer reused for AI verify).
export async function storeTelegramPhoto(fileId: string): Promise<{ url: string; buffer: Buffer }> {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const fileJson = await fileRes.json();
  const filePath = fileJson.result.file_path as string;
  const raw = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  const original = Buffer.from(await raw.arrayBuffer());

  const compressed = await sharp(original)
    .rotate() // respect EXIF orientation
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const path = `${randomUUID()}.webp`;
  const { error } = await db.storage.from('photos').upload(path, compressed, { contentType: 'image/webp' });
  if (error) throw error;
  const { data } = db.storage.from('photos').getPublicUrl(path);
  return { url: data.publicUrl, buffer: compressed };
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
