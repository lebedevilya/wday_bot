-- Tau Resort is ~40km outside Almaty, so we need to know who is driving themselves
-- and who needs a seat on a transfer.
alter table guests add column rsvp_transfer boolean not null default false;
