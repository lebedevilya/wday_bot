-- A pair is now a single guest row ("Медет + Акмарал") instead of two guests
-- sharing a team, so a team was always exactly one guest. Points move onto
-- guests, team_id becomes guest_id, teams goes away.
-- Also adds web_token for the browser version of the game (no Telegram needed).

alter table guests add column points int not null default 0;
alter table guests add column web_token uuid unique;

-- If any team still has two members, one of them arbitrarily inherits the points.
-- Only test data exists at migration time, so this is fine.
update guests g set points = t.points from teams t where g.team_id = t.id;

alter table assignments add column guest_id uuid references guests(id) on delete cascade;
update assignments a set guest_id = g.id from guests g where g.team_id = a.team_id;
delete from assignments where guest_id is null;
alter table assignments alter column guest_id set not null;
alter table assignments drop column team_id;
create index on assignments (guest_id);

alter table photos add column guest_id uuid references guests(id) on delete set null;
update photos p set guest_id = g.id from guests g where g.team_id = p.team_id;
alter table photos drop column team_id;

alter table wishes add column guest_id uuid references guests(id) on delete set null;
update wishes w set guest_id = g.id from guests g where g.team_id = w.team_id;
alter table wishes drop column team_id;

alter table guests drop column team_id;
drop table teams;
