-- RSVP became self-registration: guests type their own name instead of picking from a
-- preloaded list, and upload their own photo (which doubles as the AI reference photo).
-- So a guest row can now be created by the public form, before anyone assigns a group.
alter table guests add column rsvp_kids int not null default 0;
alter table guests add column rsvp_arrival text;

alter table guests drop constraint guests_grp_check;
alter table guests add constraint guests_grp_check
  check (grp in ('kids','aigul_family','aigul_friends','ilya_family','ilya_friends','unknown'));
alter table guests alter column grp set default 'unknown';

-- Case-insensitive name lookup: the RSVP form matches an existing guest by typed name
-- rather than creating a duplicate.
create unique index guests_name_lower_idx on guests (lower(name));

-- Game surfaces stay hidden until the wedding day so the tasks are not spoiled.
update settings set data = data || '{"game_public": false}'::jsonb where id = 1;
