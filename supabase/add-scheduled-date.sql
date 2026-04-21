-- Run this in Supabase SQL Editor
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_date date;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS scheduled_date date;
