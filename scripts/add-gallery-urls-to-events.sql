-- Adds the post-event photo gallery to events.
-- Run this against the Supabase project BEFORE deploying the matching app code:
-- eventToDbEvent() writes gallery_urls on every insert and update, so saving an
-- event from the admin panel fails until this column exists.
--
-- Apply via the Supabase dashboard SQL editor, or:
--   psql "$SUPABASE_DB_URL" -f scripts/add-gallery-urls-to-events.sql

alter table public.events
  add column if not exists gallery_urls text[] not null default '{}';
