-- wday schema. Run in Supabase SQL editor (or psql) on a fresh project.

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  points int not null default 0,
  created_at timestamptz not null default now()
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  phone text,
  grp text not null check (grp in ('kids','aigul_family','aigul_friends','ilya_family','ilya_friends')),
  status text not null default 'inactive' check (status in ('inactive','target','playing')),
  telegram_user_id bigint unique,
  team_id uuid references teams(id) on delete set null,
  locale text not null default 'ru' check (locale in ('ru','en','kk')),
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending','yes','no')),
  rsvp_party int not null default 1,
  created_at timestamptz not null default now()
);

create table task_templates (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('core','person')),
  -- {"ru": "...", "en": "...", "kk": "..."}; person-kind titles use {name} placeholder
  title jsonb not null,
  points int not null default 1,
  target_guest_id uuid references guests(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  task_template_id uuid not null references task_templates(id) on delete cascade,
  target_guest_id uuid references guests(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  photo_url text,
  ai_verdict jsonb,
  points_awarded int not null default 0,
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);
create index on assignments (team_id);
create index on assignments (target_guest_id);

create table photos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  thumb_url text,
  team_id uuid references teams(id) on delete set null,
  source text not null check (source in ('task','free','wish')),
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index on photos (created_at desc);

create table wishes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete set null,
  text text not null,
  photo_url text,
  thumb_url text,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table bot_state (
  telegram_user_id bigint primary key,
  state jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table settings (
  id int primary key check (id = 1),
  data jsonb not null
);

-- All access goes through the service-role key (server only); lock out anon.
alter table teams enable row level security;
alter table guests enable row level security;
alter table task_templates enable row level security;
alter table assignments enable row level security;
alter table photos enable row level security;
alter table wishes enable row level security;
alter table bot_state enable row level security;
alter table settings enable row level security;

-- Public bucket for compressed photos.
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;
