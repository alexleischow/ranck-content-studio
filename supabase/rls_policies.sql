-- RLS policies for PaintPro Content Studio
-- This app has no user authentication — the admin is the agency, the portal is public.
-- These policies allow full access via the anon key for all tables.
-- Run this in your Supabase SQL editor.

alter table blog_posts enable row level security;
alter table social_posts enable row level security;
alter table week_packages enable row level security;
alter table content_comments enable row level security;
alter table strategy enable row level security;

-- Allow all operations for all users (anon + service role)
create policy "allow all" on blog_posts for all using (true) with check (true);
create policy "allow all" on social_posts for all using (true) with check (true);
create policy "allow all" on week_packages for all using (true) with check (true);
create policy "allow all" on content_comments for all using (true) with check (true);
create policy "allow all" on strategy for all using (true) with check (true);
