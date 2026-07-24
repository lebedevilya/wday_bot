-- RSVP on guests
alter table guests add column rsvp_status text not null default 'pending' check (rsvp_status in ('pending','yes','no'));
alter table guests add column rsvp_party int not null default 1;
