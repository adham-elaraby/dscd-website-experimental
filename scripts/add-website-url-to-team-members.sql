-- Adds the portfolio / personal website link to team members.
-- Run this against the Supabase project BEFORE deploying the matching app code:
-- teamMemberToDbTeamMember() writes website_url on every insert and update, so
-- saving a team member from the admin panel fails until this column exists.
--
-- Apply via the Supabase dashboard SQL editor, or:
--   psql "$SUPABASE_DB_URL" -f scripts/add-website-url-to-team-members.sql

alter table public.team_members
  add column if not exists website_url text;
