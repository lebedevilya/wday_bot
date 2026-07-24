import { Bot, Context, InlineKeyboard } from 'grammy';
import { db } from './db';
import { t } from './i18n';
import { ensureAssignments, getTaskList, awardPoints, prizeFor } from './game';
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

function guestPageKeyboard(guests: Guest[], page: number, prefix: 'claim' | 'pairclaim', locale: Locale): InlineKeyboard {
  const kb = new InlineKeyboard();
  const slice = guests.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  for (const g of slice) kb.text(g.name, `${prefix}:${g.id}`).row();
  const nav = prefix === 'claim' ? 'pg' : 'pairpg';
  if (page > 0) kb.text(t(locale, 'prev_page'), `${nav}:${page - 1}`);
  if ((page + 1) * PAGE_SIZE < guests.length) kb.text(t(locale, 'next_page'), `${nav}:${page + 1}`);
  return kb;
}

// --- flows ---

async function showNamePicker(ctx: Context, page: number, prefix: 'claim' | 'pairclaim' = 'claim') {
  const locale = await loc(ctx);
  const guests = await unclaimedGuests();
  const mine = await getGuest(ctx.from!.id);
  const list = prefix === 'pairclaim' && mine ? guests.filter((g) => g.id !== mine.id) : guests;
  if (!list.length) return ctx.reply(t(locale, 'no_names_left'));
  const text = t(locale, prefix === 'claim' ? 'pick_name' : 'pair_pick');
  const kb = guestPageKeyboard(list, page, prefix, locale);
  if (ctx.callbackQuery) await ctx.editMessageText(text, { reply_markup: kb }).catch(() => ctx.reply(text, { reply_markup: kb }));
  else await ctx.reply(text, { reply_markup: kb });
}

async function showTasks(ctx: Context) {
  const guest = await getGuest(ctx.from!.id);
  if (!guest?.team_id) return ctx.reply(t(await loc(ctx), 'not_joined'));
  await ensureAssignments(guest.team_id); // lazy top-up as more guests join
  const tasks = await getTaskList(guest.team_id, guest.locale);
  const lines = tasks.map((tv, i) => `${tv.done ? '✅' : '▫️'} ${i + 1}. ${tv.title} (+${tv.points})`);
  const kb = new InlineKeyboard();
  tasks.forEach((tv, i) => {
    if (!tv.done) kb.text(`📸 ${i + 1}. ${tv.title}`.slice(0, 60), `sub:${tv.assignment.id}`).row();
  });
  await ctx.reply(`${t(guest.locale, 'tasks_header')}\n\n${lines.join('\n')}`, { reply_markup: kb });
}

async function finishJoin(ctx: Context, guest: Guest) {
  await ensureAssignments(guest.team_id!);
  await ctx.reply(t(guest.locale, 'joined', { name: guest.name }));
  await ctx.reply(t(guest.locale, 'help'));
  await showTasks(ctx);
}

// --- commands ---

bot.command('start', async (ctx) => {
  const guest = await getGuest(ctx.from!.id);
  if (guest?.team_id) return showTasks(ctx);
  await ctx.reply(t('ru', 'pick_locale'), { reply_markup: localeKeyboard() });
});

bot.command('tasks', showTasks);

bot.command('score', async (ctx) => {
  const guest = await getGuest(ctx.from!.id);
  if (!guest?.team_id) return ctx.reply(t(await loc(ctx), 'not_joined'));
  const [{ data: team }, settings] = await Promise.all([
    db.from('teams').select('*').eq('id', guest.team_id).single(),
    getSettings(),
  ]);
  const prize = prizeFor(team!.points, settings.prize_tiers, guest.locale);
  await ctx.reply(
    t(guest.locale, 'score', {
      team: team!.name,
      points: team!.points,
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
      if (guest.team_id) return showTasks(ctx);
    } else {
      await setState(tgId, { ...(await getState(tgId)), locale });
    }
    return showNamePicker(ctx, 0);
  }

  if (data.startsWith('pg:')) return showNamePicker(ctx, Number(data.slice(3)));
  if (data.startsWith('pairpg:')) return showNamePicker(ctx, Number(data.slice(7)), 'pairclaim');

  if (data.startsWith('claim:')) {
    const guestId = data.slice(6);
    const locale = await loc(ctx);
    const { data: g } = await db.from('guests').select('*').eq('id', guestId).maybeSingle();
    if (!g || g.telegram_user_id) return showNamePicker(ctx, 0); // taken meanwhile
    let teamId = g.team_id;
    if (!teamId) {
      const { data: team } = await db.from('teams').insert({ name: g.name }).select('id').single();
      teamId = team!.id;
    }
    await db
      .from('guests')
      .update({ telegram_user_id: tgId, locale, status: 'playing', team_id: teamId })
      .eq('id', guestId);
    if (g.team_id) {
      // partner already created the team — just bind and play
      const guest = (await getGuest(tgId))!;
      return finishJoin(ctx, guest);
    }
    const kb = new InlineKeyboard().text(t(locale, 'pair_yes'), 'pair:yes').text(t(locale, 'pair_no'), 'pair:no');
    return ctx.editMessageText(t(locale, 'pair_question'), { reply_markup: kb }).catch(() => ctx.reply(t(locale, 'pair_question'), { reply_markup: kb }));
  }

  if (data === 'pair:no') {
    const guest = await getGuest(tgId);
    if (guest) return finishJoin(ctx, guest);
    return;
  }

  if (data === 'pair:yes') return showNamePicker(ctx, 0, 'pairclaim');

  if (data.startsWith('pairclaim:')) {
    const partnerId = data.slice(10);
    const me = await getGuest(tgId);
    if (!me?.team_id) return;
    const { data: partner } = await db.from('guests').select('*').eq('id', partnerId).maybeSingle();
    if (!partner || partner.telegram_user_id || partner.team_id) return showNamePicker(ctx, 0, 'pairclaim');
    await db.from('guests').update({ team_id: me.team_id, status: 'playing' }).eq('id', partnerId);
    const teamName = `${me.name} + ${partner.name}`;
    await db.from('teams').update({ name: teamName }).eq('id', me.team_id);
    await ctx.reply(t(me.locale, 'pair_done', { team: teamName }));
    return finishJoin(ctx, me);
  }

  if (data.startsWith('sub:')) {
    const guest = await getGuest(tgId);
    if (!guest) return;
    await setState(tgId, { awaiting: { kind: 'task', assignment_id: data.slice(4) } });
    const tasks = await getTaskList(guest.team_id!, guest.locale);
    const tv = tasks.find((x) => x.assignment.id === data.slice(4));
    return ctx.reply(t(guest.locale, 'send_photo_now', { task: tv?.title ?? '' }));
  }
});

// --- photo handling ---

bot.on('message:photo', async (ctx) => {
  const tgId = ctx.from.id;
  const guest = await getGuest(tgId);
  if (!guest?.team_id) return ctx.reply(t(await loc(ctx), 'not_joined'));
  const state = await getState(tgId);
  const awaiting = state.awaiting ?? { kind: 'free' as const }; // unsolicited photo → wall
  const fileId = ctx.message.photo.at(-1)!.file_id;

  if (awaiting.kind === 'task') {
    await ctx.reply(t(guest.locale, 'checking'));
    const { url, thumbUrl, buffer, mime } = await storeTelegramPhoto(fileId);
    const { data: a } = await db
      .from('assignments')
      .select('*, task_templates(*), target:guests!assignments_target_guest_id_fkey(name, photo_url)')
      .eq('id', awaiting.assignment_id)
      .single();
    if (!a || a.status === 'approved') return;
    const tt = a.task_templates as TaskTemplate;
    const target = a.target as { name: string; photo_url: string | null } | null;
    let title = tt.title[guest.locale] ?? tt.title.ru;
    if (target) title = title.replaceAll('{name}', target.name);
    const reference = target?.photo_url ? await fetchImage(target.photo_url) : null;
    const verdict = await verifyPhoto(buffer, title, reference, mime);
    await db.from('assignments').update({ photo_url: url, ai_verdict: verdict, submitted_at: new Date().toISOString() }).eq('id', a.id);
    await setState(tgId, { ...state, awaiting: undefined });
    if (verdict.match === 'no') return ctx.reply(t(guest.locale, 'rejected'));
    const total = await awardPoints(a.id, tt.points);
    await db.from('photos').insert({ url, thumb_url: thumbUrl, team_id: guest.team_id, source: 'task' });
    return ctx.reply(t(guest.locale, 'approved', { points: tt.points, total }));
  }

  if (awaiting.kind === 'wish') {
    const { url, thumbUrl } = await storeTelegramPhoto(fileId);
    await db.from('wishes').insert({ team_id: guest.team_id, text: ctx.message.caption ?? '', photo_url: url, thumb_url: thumbUrl });
    await setState(tgId, { ...state, awaiting: undefined });
    return ctx.reply(t(guest.locale, 'wish_saved'));
  }

  // free
  const { url, thumbUrl } = await storeTelegramPhoto(fileId);
  await db.from('photos').insert({ url, thumb_url: thumbUrl, team_id: guest.team_id, source: 'free' });
  await setState(tgId, { ...state, awaiting: undefined });
  return ctx.reply(t(guest.locale, 'photo_saved', { url: `${SITE}/wall` }));
});

// --- text (wishes) ---

bot.on('message:text', async (ctx) => {
  const tgId = ctx.from.id;
  const guest = await getGuest(tgId);
  const state = await getState(tgId);
  if (guest && state.awaiting?.kind === 'wish') {
    await db.from('wishes').insert({ team_id: guest.team_id, text: ctx.message.text });
    await setState(tgId, { ...state, awaiting: undefined });
    return ctx.reply(t(guest.locale, 'wish_saved'));
  }
  await ctx.reply(t(await loc(ctx), guest ? 'help' : 'not_joined'));
});
