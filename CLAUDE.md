# Ranck Inc. Content Studio

Social media and blog content management app for **Ranck Inc.** (Lancaster, PA) — a family-owned HVAC, plumbing, and excavation company in business since 1953. Agency (us) generates content, bundles it into weekly packages, sends the client a review link. Client approves or comments. We post manually.

**Client:** Ranck Plumbing, Heating, AC & Excavation — ranckinc.com — 717-397-2577
**Full company context:** See `COMPANY.md` (injected into every AI prompt automatically)

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** — Postgres DB, no auth (portal is public token-gated, no login required)
- **Tailwind + shadcn/ui** — UI components in `src/components/ui/`
- **Anthropic Claude API** (`claude-sonnet-4-6`) — all AI generation
- **Vercel** — deployment target

## Env vars (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project structure

```
src/
  app/
    page.tsx                        → redirects to /admin
    layout.tsx                      → root layout, Toaster
    admin/
      layout.tsx                    → sidebar nav (Dashboard, Generate, Packages, Strategy)
      page.tsx                      → dashboard: stats + recent packages
      generate/page.tsx             → 3-tab generator: Blog | Social | Full Week
      packages/page.tsx             → bundle drafts into week packages, copy client review link
      strategy/page.tsx             → AI-generated daily/weekly/monthly posting strategy
    portal/[token]/
      page.tsx                      → server component, fetches package by review_token
      ClientPortal.tsx              → client-facing review UI (approve, comment, submit)
    api/
      generate-blog/route.ts        → POST {topic, keywords} → HTML + SEO meta
      generate-social/route.ts      → POST {platform, topic, weekTheme} → caption + hashtags + image_prompt
      generate-week/route.ts        → POST {weekStart} → week plan topics (no content yet)
      generate-week-full/route.ts   → POST {weekStart, weekPlan} → generates + saves all content
      generate-strategy/route.ts    → POST {companyName, location, services} → full strategy JSON
      save-blog/route.ts            → POST blog → insert as draft
      save-social/route.ts          → POST social → insert as draft
      add-comment/route.ts          → POST comment from client portal
      update-status/route.ts        → POST {type, id, status} → updates blog/social/package status
  lib/
    supabase/
      client.ts                     → createClient() for "use client" components
      server.ts                     → createClient() + createServiceClient() for API routes
    ai/
      generate.ts                   → generateBlogPost, generateSocialPost, generateWeeklyTopics, generateStrategy
      prompts.ts                    → all prompt templates (COMPANY_CONTEXT, blogPostPrompt, etc.)
    utils.ts                        → cn()
  types/
    database.ts                     → BlogPost, SocialPost, WeekPackage, ContentComment, Strategy
  components/ui/                    → shadcn: button, card, badge, input, label, textarea, tabs, separator, sonner
```

## Database tables (`supabase/schema.sql`)

| Table | Key columns |
|---|---|
| `blog_posts` | id, title, slug, content_html, excerpt, seo_title, seo_description, status (draft/approved/published), week_package_id |
| `social_posts` | id, platform (linkedin/instagram/facebook), caption, hashtags[], image_prompt, image_url, status, week_package_id |
| `week_packages` | id, week_label, week_start, review_token (hex, unique), status (pending_review/changes_requested/approved), client_notes |
| `content_comments` | id, content_type, content_id, week_package_id, author, body |
| `strategy` | id, company_name, overview, target_audience, brand_voice, daily_plan (jsonb), weekly_plan (jsonb), monthly_plan (jsonb), content_pillars[] |

## Key patterns

**Supabase clients:** `createClient()` from `lib/supabase/client.ts` in client components. `createServiceClient()` from `lib/supabase/server.ts` in API routes that write. Both are untyped — cast results to types in `types/database.ts`.

**Dynamic pages:** Any page/layout that touches Supabase must export `export const dynamic = "force-dynamic"` to avoid prerender errors during build.

**AI generation:** All calls go through `lib/ai/generate.ts`. Blog posts return raw text split on `---META---` (HTML first, JSON after). Social and strategy return JSON extracted with `raw.match(/\{[\s\S]*\}/)`.

**Prompt system:** `lib/ai/prompts.ts` loads `COMPANY.md` at runtime and injects it into every prompt. Also bakes in the social-content skill framework: hook formulas (curiosity/story/value/contrarian/social proof), content pillar mix (30% educational, 25% trust-building, 25% transformation, 15% local/seasonal, 5% promotional), and platform-specific templates for LinkedIn, Instagram, and Facebook. To update the company context, edit `COMPANY.md` — no code changes needed.

**WordPress blog posts:** `content_html` is inner HTML only — no `<html>/<body>` wrappers. Uses `<h2>`, `<h3>`, `<p>`, `<ul>`, `<li>`, `<strong>`. Title is set separately in WordPress. "Copy HTML" button puts this on clipboard for direct paste.

**Client portal:** Public, no auth. `/portal/[token]` where `token` = `review_token` from `week_packages`. Client approves items, leaves comments per item, submits overall notes. Any comment auto-sets package to `changes_requested`.

## Content workflow

1. `/admin/generate` → generate blog drafts, social drafts, or a full week at once
2. `/admin/packages` → create a week package, select which drafts to include
3. Copy the shareable review link → send to client
4. Client visits `/portal/[token]` → approves or leaves comments
5. Agency reviews feedback in `/admin/packages` → posts manually when approved

## Commands

```bash
npm run dev      # local dev on :3000
npm run build    # production build
npx tsc --noEmit # type check only
```
