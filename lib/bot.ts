import { Bot, Context, InlineKeyboard } from 'grammy';
import { db } from './db';
import { t } from './i18n';
import { ensureAssignments, getTaskList, awardPoints, prizeFor, targetLabel } from './game';
import { getSettings } from './db';
import { storeTelegramPhoto, fetchImage } from './images';
import { verifyPhoto } from './verify';
import type { BotState, Guest, Locale, TaskTemplate } from './types';

export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

const PAGE_SIZE = 8;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? '';

// --- state helpers (bot_state table; serverless-safe) ---

async function getState(tgId: number): Promise<BotState> {
  const { data } = await db.from('bot_state').select('state').eq('telegram_user_id', tgId).maybeSingle();
  return (data?.state as BotState) ?? {};
}

async function setState(tgId: number, state: BotState): Promise<void> {
  await db.from('bot_state').upsert({ telegram_user_id: tgId, state, updated_at: new Date().toISOString() });
}

async function getGuest(tgId: number): Promise<Guest | null> {
  const { data } = await db.from('guests').select('*').eq('telegram_user_id', tgId).maybeSingle();
  return data as Guest | null;
}

async function loc(ctx: Context): Promise<Locale> {
  const tgId = ctx.from!.id;
  const guest = await getGuest(tgId);
  if (guest) return guest.locale;
  return (await getState(tgId)).locale ?? 'ru';
}

// --- keyboards ---

function localeKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('Русский 🇷🇺', 'loc:ru').text('Қазақша 🇰🇿', 'loc:kk').text('English 🇬🇧', 'loc:en');
}

async function unclaimedGuests(): Promise<Guest[]> {
  // 'target' guests (grandma, 3-year-olds) appear in tasks but never in the join picker
  const { data } = await db.from('guests').select('*').is('telegram_user_id', null).neq('status', 'target').order('name');
  return (data as Guest[]) ?? [];
}

function guestPageKeyboard(guests: Guest[], page: number, locale: Locale): InlineKeyboard {
  const kb = new InlineKeyboard();
  const slice = guests.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  for (const g of slice) kb.text(g.name, `claim:${g.id}`).row();
  if (page > 0) kb.text(t(locale, 'prev_page'), `pg:${page - 1}`);
  if ((page + 1) * PAGE_SIZE < guests.length) kb.text(t(locale, 'next_page'), `pg:${page + 1}`);
  return kb;
}

// --- flows ---

async function showNamePicker(ctx: Context, page: number) {
  const locale = await loc(ctx);
  const guests = await unclaimedGuests();
  if (!guests.length) return ctx.reply(t(locale, 'no_names_left'));
  const text = t(locale, 'pick_name');
  const kb = guestPageKeyboard(guests, page, locale);
  if (ctx.callbackQuery) await ctx.editMessageText(text, { reply_markup: kb }).catch(() => ctx.reply(text, { reply_markup: kb }));
  else await ctx.reply(text, { reply_markup: kb });
}

async function showTasks(ctx: Context) {
  const guest = await getGuest(ctx.from!.id);
  if (guest?.status !== 'playing') return ctx.reply(t(await loc(ctx), 'not_joined'));
  await ensureAssignments(guest.id); // lazy top-up as more guests join
  const tasks = await getTaskList(guest.id, guest.locale);
  const lines = tasks.map((tv, i) => `${tv.done ? '✅' : '▫️'} ${i + 1}. ${tv.title} (+${tv.points})`);
  const kb = new InlineKeyboard();
  tasks.forEach((tv, i) => {
    if (!tv.done) kb.text(`📸 ${i + 1}. ${tv.title}`.slice(0, 60), `sub:${tv.assignment.id}`).row();
  });
  await ctx.reply(`${t(guest.locale, 'tasks_header')}\n\n${lines.join('\n')}`, { reply_markup: kb });
}

async function finishJoin(ctx: Context, guest: Guest) {
  await ensureAssignments(guest.id);
  await ctx.reply(t(guest.locale, 'joined', { name: guest.name }));
  await ctx.reply(t(guest.locale, 'help'));
  await showTasks(ctx);
}

// --- commands ---

bot.command('start', async (ctx) => {
  const guest = await getGuest(ctx.from!.id);
  if (guest?.status === 'playing') return showTasks(ctx);
  await ctx.reply(t('ru', 'pick_locale'), { reply_markup: localeKeyboard() });
});

bot.command('tasks', showTasks);

bot.command('score', async (ctx) => {
  const guest = await getGuest(ctx.from!.id);
  if (guest?.status !== 'playing') return ctx.reply(t(await loc(ctx), 'not_joined'));
  const settings = await getSettings();
  const prize = prizeFor(guest.points, settings.prize_tiers, guest.locale);
  await ctx.reply(
    t(guest.locale, 'score', {
      name: guest.name,
      points: guest.points,
      prize: prize ? t(guest.locale, 'prize_current', { prize }) : t(guest.locale, 'prize_none'),
    }),
  );
});

bot.command('wish', async (ctx) => {
  const guest = await getGuest(ctx.from!.id);
  if (!guest) return ctx.reply(t(await loc(ctx), 'not_joined'));
  await setState(ctx.from!.id, { awaiting: { kind: 'wish' } });
  await ctx.reply(t(guest.locale, 'wish_prompt'));
});

bot.command('photo', async (ctx) => {
  const guest = await getGuest(ctx.from!.id);
  if (!guest) return ctx.reply(t(await loc(ctx), 'not_joined'));
  await setState(ctx.from!.id, { awaiting: { kind: 'free' } });
  await ctx.reply(t(guest.locale, 'free_photo_prompt'));
});

bot.command('lang', async (ctx) => ctx.reply(t(await loc(ctx), 'pick_locale'), { reply_markup: localeKeyboard() }));
bot.command('help', async (ctx) => ctx.reply(t(await loc(ctx), 'help')));

// --- callbacks ---

bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const tgId = ctx.from.id;
  await ctx.answerCallbackQuery().catch(() => {});

  if (data.startsWith('loc:')) {
    const locale = data.slice(4) as Locale;
    const guest = await getGuest(tgId);
    if (guest) {
      await db.from('guests').update({ locale }).eq('id', guest.id);
      if (guest.status === 'playing') return showTasks(ctx);
    } else {
      await setState(tgId, { ...(await getState(tgId)), locale });
    }
    return showNamePicker(ctx, 0);
  }

  if (data.startsWith('pg:')) return showNamePicker(ctx, Number(data.slice(3)));

  if (data.startsWith('claim:')) {
    const guestId = data.slice(6);
    const locale = await loc(ctx);
    const { data: g } = await db.from('guests').select('*').eq('id', guestId).maybeSingle();
    if (!g || g.telegram_user_id || g.web_token) return showNamePicker(ctx, 0); // taken meanwhile
    await db.from('guests').update({ telegram_user_id: tgId, locale, status: 'playing' }).eq('id', guestId);
    return finishJoin(ctx, (await getGuest(tgId))!);
  }

  if (data.startsWith('sub:')) {
    const guest = await getGuest(tgId);
    if (!guest) return;
    await setState(tgId, { awaiting: { kind: 'task', assignment_id: data.slice(4) } });
    const tasks = await getTaskList(guest.id, guest.locale);
    const tv = tasks.find((x) => x.assignment.id === data.slice(4));
    return ctx.reply(t(guest.locale, 'send_photo_now', { task: tv?.title ?? '' }));
  }
});

// --- photo handling ---

bot.on('message:photo', async (ctx) => {
  const tgId = ctx.from.id;
  const guest = await getGuest(tgId);
  if (guest?.status !== 'playing') return ctx.reply(t(await loc(ctx), 'not_joined'));
  const state = await getState(tgId);
  const awaiting = state.awaiting ?? { kind: 'free' as const }; // unsolicited photo → wall
  const fileId = ctx.message.photo.at(-1)!.file_id;

  if (awaiting.kind === 'task') {
    await ctx.reply(t(guest.locale, 'checking'));
    const { url, thumbUrl, thumb } = await storeTelegramPhoto(fileId);
    const { data: a } = await db
      .from('assignments')
      .select('*, task_templates(*), target:guests!assignments_target_guest_id_fkey(name, relation, photo_url)')
      .eq('id', awaiting.assignment_id)
      .single();
    if (!a || a.status === 'approved') return;
    const tt = a.task_templates as TaskTemplate;
    const target = a.target as { name: string; relation: string | null; photo_url: string | null } | null;
    let title = tt.title[guest.locale] ?? tt.title.ru;
    if (target) title = title.replaceAll('{name}', targetLabel(target));
    const reference = target?.photo_url ? await fetchImage(target.photo_url) : null;
    const verdict = await verifyPhoto(thumb, title, reference);
    await db.from('assignments').update({ photo_url: url, ai_verdict: verdict, submitted_at: new Date().toISOString() }).eq('id', a.id);
    await setState(tgId, { ...state, awaiting: undefined });
    if (verdict.match === 'no') return ctx.reply(t(guest.locale, 'rejected'));
    const total = await awardPoints(a.id, tt.points);
    await db.from('photos').insert({ url, thumb_url: thumbUrl, guest_id: guest.id, source: 'task' });
    return ctx.reply(t(guest.locale, 'approved', { points: tt.points, total }));
  }

  if (awaiting.kind === 'wish') {
    const { url, thumbUrl } = await storeTelegramPhoto(fileId);
    await db.from('wishes').insert({ guest_id: guest.id, text: ctx.message.caption ?? '', photo_url: url, thumb_url: thumbUrl });
    await setState(tgId, { ...state, awaiting: undefined });
    return ctx.reply(t(guest.locale, 'wish_saved'));
  }

  // free
  const { url, thumbUrl } = await storeTelegramPhoto(fileId);
  await db.from('photos').insert({ url, thumb_url: thumbUrl, guest_id: guest.id, source: 'free' });
  await setState(tgId, { ...state, awaiting: undefined });
  return ctx.reply(t(guest.locale, 'photo_saved', { url: `${SITE}/wall` }));
});

// --- text (wishes) ---

bot.on('message:text', async (ctx) => {
  const tgId = ctx.from.id;
  const guest = await getGuest(tgId);
  const state = await getState(tgId);
  if (guest && state.awaiting?.kind === 'wish') {
    await db.from('wishes').insert({ guest_id: guest.id, text: ctx.message.text });
    await setState(tgId, { ...state, awaiting: undefined });
    return ctx.reply(t(guest.locale, 'wish_saved'));
  }
  await ctx.reply(t(await loc(ctx), guest ? 'help' : 'not_joined'));
});
