export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: BlogPost
        Insert: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BlogPost, 'id' | 'created_at'>>
      }
      social_posts: {
        Row: SocialPost
        Insert: Omit<SocialPost, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SocialPost, 'id' | 'created_at'>>
      }
      week_packages: {
        Row: WeekPackage
        Insert: Omit<WeekPackage, 'id' | 'created_at' | 'updated_at' | 'review_token'>
        Update: Partial<Omit<WeekPackage, 'id' | 'created_at' | 'review_token'>>
      }
      content_comments: {
        Row: ContentComment
        Insert: Omit<ContentComment, 'id' | 'created_at'>
        Update: Partial<Omit<ContentComment, 'id' | 'created_at'>>
      }
      strategy: {
        Row: Strategy
        Insert: Omit<Strategy, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Strategy, 'id' | 'created_at'>>
      }
    }
  }
}

export type BlogPost = {
  id: string
  title: string
  slug: string
  content_html: string
  excerpt: string | null
  seo_title: string | null
  seo_description: string | null
  status: 'draft' | 'approved' | 'published'
  week_package_id: string | null
  scheduled_date: string | null
  created_at: string
  updated_at: string
}

export type SocialPost = {
  id: string
  platform: 'linkedin' | 'instagram' | 'facebook'
  caption: string
  hashtags: string[] | null
  image_prompt: string | null
  image_url: string | null
  status: 'draft' | 'approved' | 'published'
  week_package_id: string | null
  scheduled_date: string | null
  created_at: string
  updated_at: string
}

export type WeekPackage = {
  id: string
  week_label: string
  week_start: string
  review_token: string
  status: 'pending_review' | 'changes_requested' | 'approved'
  client_notes: string | null
  created_at: string
  updated_at: string
}

export type ContentComment = {
  id: string
  content_type: 'blog_post' | 'social_post'
  content_id: string
  week_package_id: string
  author: string
  body: string
  created_at: string
}

export type Strategy = {
  id: string
  company_name: string
  overview: string | null
  target_audience: string | null
  brand_voice: string | null
  daily_plan: Record<string, string[]> | null
  weekly_plan: Record<string, string[]> | null
  monthly_plan: Record<string, string[]> | null
  content_pillars: string[] | null
  created_at: string
  updated_at: string
}
