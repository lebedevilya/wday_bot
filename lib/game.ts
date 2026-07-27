import { db, getSettings } from './db';
import type { Assignment, Guest, Locale, PrizeTier, TaskTemplate } from './types';

// Assign missing tasks to a player: K least-assigned core tasks + M person tasks
// preferring targets from a different group than the player, least-targeted first.
// Safe to call repeatedly (lazy top-up as the target pool grows).
export async function ensureAssignments(guestId: string): Promise<void> {
  const settings = await getSettings();
  const [{ data: me }, { data: existing }, { data: templates }] = await Promise.all([
    db.from('guests').select('*').eq('id', guestId).maybeSingle(),
    db.from('assignments').select('*').eq('guest_id', guestId),
    db.from('task_templates').select('*').eq('active', true),
  ]);
  if (!me || !templates) return;
  const own = existing ?? [];

  const personTemplate = templates.find((tt) => tt.kind === 'person' && !tt.target_guest_id);
  const rows: Partial<Assignment>[] = [];

  // --- core tasks ---
  const haveCore = own.filter((a) => {
    const tt = templates.find((x) => x.id === a.task_template_id);
    return tt?.kind === 'core';
  });
  const needCore = settings.core_tasks_per_player - haveCore.length;
  if (needCore > 0) {
    const { data: counts } = await db.from('assignments').select('task_template_id');
    const usage = new Map<string, number>();
    for (const a of counts ?? []) usage.set(a.task_template_id, (usage.get(a.task_template_id) ?? 0) + 1);
    const candidates = templates
      .filter(
        (tt: TaskTemplate) =>
          tt.kind === 'core' &&
          !own.some((a) => a.task_template_id === tt.id) &&
          tt.target_guest_id !== me.id, // never "take a photo with yourself"
      )
      .sort((a, b) => (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0) || Math.sign(hash(a.id + guestId) - hash(b.id + guestId)));
    for (const tt of candidates.slice(0, needCore)) {
      rows.push({ guest_id: guestId, task_template_id: tt.id, target_guest_id: tt.target_guest_id });
    }
  }

  // --- person tasks ---
  if (personTemplate) {
    const havePerson = own.filter((a) => a.task_template_id === personTemplate.id);
    const needPerson = settings.person_tasks_per_player - havePerson.length;
    if (needPerson > 0) {
      const [{ data: pool }, { data: targeted }] = await Promise.all([
        db.from('guests').select('*').in('status', ['playing', 'target']),
        db.from('assignments').select('target_guest_id').not('target_guest_id', 'is', null),
      ]);
      const targetCount = new Map<string, number>();
      for (const a of targeted ?? []) targetCount.set(a.target_guest_id!, (targetCount.get(a.target_guest_id!) ?? 0) + 1);
      const alreadyTargeted = new Set(own.map((a) => a.target_guest_id).filter(Boolean));
      const candidates = (pool ?? [])
        .filter((g: Guest) => g.id !== me.id && !alreadyTargeted.has(g.id))
        .sort((a: Guest, b: Guest) => {
          const crossA = a.grp === me.grp ? 1 : 0; // 0 = cross-group, preferred
          const crossB = b.grp === me.grp ? 1 : 0;
          return crossA - crossB || (targetCount.get(a.id) ?? 0) - (targetCount.get(b.id) ?? 0) || Math.sign(hash(a.id + guestId) - hash(b.id + guestId));
        });
      for (const g of candidates.slice(0, needPerson)) {
        rows.push({ guest_id: guestId, task_template_id: personTemplate.id, target_guest_id: g.id });
      }
    }
  }

  if (rows.length) await db.from('assignments').insert(rows);
}

// ponytail: deterministic pseudo-random tiebreak (Date.now/Math.random-free, stable per player)
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export interface TaskView {
  assignment: Assignment;
  title: string;
  points: number;
  done: boolean;
}

export async function getTaskList(guestId: string, locale: Locale): Promise<TaskView[]> {
  const { data: assignments } = await db
    .from('assignments')
    .select('*, task_templates(*), target:guests!assignments_target_guest_id_fkey(name)')
    .eq('guest_id', guestId)
    // tie-break on id: a batch insert gives every row the same created_at, and without
    // a stable second key the list reshuffles as soon as one row is updated
    .order('created_at')
    .order('id');
  return (assignments ?? []).map((a) => {
    const tt = a.task_templates as TaskTemplate;
    let title = tt.title[locale] ?? tt.title.ru;
    if (a.target && tt.kind === 'person') title = title.replaceAll('{name}', (a.target as { name: string }).name);
    return { assignment: a as Assignment, title, points: tt.points, done: a.status === 'approved' };
  });
}

export async function awardPoints(assignmentId: string, points: number): Promise<number> {
  const { data: a } = await db
    .from('assignments')
    .update({ status: 'approved', points_awarded: points })
    .eq('id', assignmentId)
    .select('guest_id')
    .single();
  const { data: guest } = await db.from('guests').select('points').eq('id', a!.guest_id).single();
  const total = (guest?.points ?? 0) + points;
  await db.from('guests').update({ points: total }).eq('id', a!.guest_id);
  return total;
}

export function prizeFor(points: number, tiers: PrizeTier[], locale: Locale): string | null {
  const tier = [...tiers].sort((a, b) => b.min_points - a.min_points).find((t) => points >= t.min_points);
  return tier ? (tier.prize[locale] ?? tier.prize.ru) : null;
}
