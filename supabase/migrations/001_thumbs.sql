-- Thumbnails for wall grid; url now stores the full (Telegram-quality) version.
alter table photos add column thumb_url text;
alter table wishes add column thumb_url text;
