export type Locale = 'ru' | 'en' | 'kk';
export type GuestGroup = 'kids' | 'aigul_family' | 'aigul_friends' | 'ilya_family' | 'ilya_friends';
export type GuestStatus = 'inactive' | 'target' | 'playing';

export interface Guest {
  id: string;
  name: string;
  relation: string | null;
  photo_url: string | null;
  phone: string | null;
  grp: GuestGroup;
  status: GuestStatus;
  telegram_user_id: number | null;
  web_token: string | null;
  points: number;
  locale: Locale;
  rsvp_status: 'pending' | 'yes' | 'no';
  rsvp_party: number;
}

export interface TaskTemplate {
  id: string;
  kind: 'core' | 'person';
  title: Record<Locale, string>;
  points: number;
  target_guest_id: string | null;
  active: boolean;
}

export interface Assignment {
  id: string;
  guest_id: string;
  task_template_id: string;
  target_guest_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  photo_url: string | null;
  ai_verdict: unknown;
  points_awarded: number;
}

export interface PrizeTier {
  min_points: number;
  prize: Record<Locale, string>;
}

export interface Settings {
  core_tasks_per_player: number;
  person_tasks_per_player: number;
  prize_tiers: PrizeTier[];
}

// bot_state.state shape
export interface BotState {
  locale?: Locale;
  // assignment id awaiting a photo, or 'free' / 'wish' modes
  awaiting?: { kind: 'task'; assignment_id: string } | { kind: 'free' } | { kind: 'wish' };
}
