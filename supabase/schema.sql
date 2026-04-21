-- Social Media Management App Schema
-- Run this in your Supabase SQL editor

-- Blog posts
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content_html text not null,
  excerpt text,
  seo_title text,
  seo_description text,
  status text not null default 'draft', -- draft | approved | published
  week_package_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Social posts
create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null, -- linkedin | instagram | facebook
  caption text not null,
  hashtags text[],
  image_prompt text,
  image_url text,
  status text not null default 'draft', -- draft | approved | published
  week_package_id uuid,
  scheduled_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Weekly content packages (groups blogs + social posts for client review)
create table if not exists week_packages (
  id uuid primary key default gen_random_uuid(),
  week_label text not null, -- e.g. "Week of April 21, 2026"
  week_start date not null,
  review_token text unique not null default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending_review', -- pending_review | changes_requested | approved
  client_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Client comments on individual pieces of content
create table if not exists content_comments (
  id uuid primary key default gen_random_uuid(),
  content_type text not null, -- blog_post | social_post
  content_id uuid not null,
  week_package_id uuid not null references week_packages(id) on delete cascade,
  author text not null default 'Client',
  body text not null,
  created_at timestamptz default now()
);

-- Strategy document (one row, updated in place)
create table if not exists strategy (
  id uuid primary key default gen_random_uuid(),
  company_name text not null default 'Client Painting Company',
  overview text,
  target_audience text,
  brand_voice text,
  daily_plan jsonb,
  weekly_plan jsonb,
  monthly_plan jsonb,
  content_pillars text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Foreign key links after both tables exist
alter table blog_posts add constraint fk_blog_week foreign key (week_package_id) references week_packages(id) on delete set null;
alter table social_posts add constraint fk_social_week foreign key (week_package_id) references week_packages(id) on delete set null;

-- Indexes
create index on blog_posts(week_package_id);
create index on social_posts(week_package_id);
create index on social_posts(platform);
create index on week_packages(review_token);
create index on content_comments(content_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger blog_posts_updated_at before update on blog_posts for each row execute function update_updated_at();
create trigger social_posts_updated_at before update on social_posts for each row execute function update_updated_at();
create trigger week_packages_updated_at before update on week_packages for each row execute function update_updated_at();

-- Storage bucket for generated social media images
-- Run this separately in Supabase SQL editor OR create via Dashboard > Storage
insert into storage.buckets (id, name, public)
values ('social-images', 'social-images', true)
on conflict (id) do nothing;

-- Allow public reads and anon uploads
create policy "public read" on storage.objects for select using (bucket_id = 'social-images');
create policy "anon upload" on storage.objects for insert with check (bucket_id = 'social-images');
