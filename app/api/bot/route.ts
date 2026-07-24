import { webhookCallback } from 'grammy';
import { bot } from '@/lib/bot';

export const maxDuration = 60; // AI verify + image processing can take a while

const handler = webhookCallback(bot, 'std/http', {
  secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
});

export async function POST(req: Request) {
  try {
    return await handler(req);
  } catch (e) {
    console.error('bot error', e);
    return new Response('ok'); // never let Telegram retry-storm us
  }
}
