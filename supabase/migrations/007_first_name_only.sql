-- RSVP now asks for a first name only, so two guests really can type "Медет".
-- A unique index would make the second one silently overwrite the first, so drop it
-- and keep a plain index for lookups. Duplicate-submit protection comes from the
-- wday_rsvp cookie instead, and the route only reuses a row nobody has answered as.
drop index if exists guests_name_lower_idx;
create index guests_name_lower_idx on guests (lower(name));
