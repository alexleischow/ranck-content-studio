import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { blogPostPrompt, socialPostPrompt, strategyPrompt, weeklyTopicsPrompt } from './prompts'
import type { Strategy } from '@/types/database'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

// Service-role Supabase client for server-side reads
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Fetch the saved strategy once per generation call and format it for prompt injection
async function fetchStrategyContext(): Promise<string> {
  try {
    const { data } = await getSupabase()
      .from('strategy')
      .select('*')
      .limit(1)
      .single()

    if (!data) return ''

    const s = data as Strategy
    const pillars = s.content_pillars?.join(', ') ?? ''
    const weekly = s.weekly_plan as Record<string, string> | null

    return `
## Active Strategy Context

**Overview:** ${s.overview ?? ''}

**Target Audience:** ${s.target_audience ?? ''}

**Brand Voice:** ${s.brand_voice ?? ''}

**Content Pillars:** ${pillars}

**Weekly Content Mix:**
${weekly ? Object.entries(weekly).map(([k, v]) => `- ${k}: ${v}`).join('\n') : ''}
`.trim()
  } catch {
    return ''
  }
}

async function ask(prompt: string, maxTokens = 4096): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: 'You are an expert content strategist and copywriter. Return only what is asked — no preamble or explanation.',
    messages: [{ role: 'user', content: prompt }],
  })
  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text
}

// More robust JSON extractor — finds the outermost { } and attempts repair if truncated
function extractJSON(raw: string): any {
  const start = raw.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in response')
  let depth = 0
  let end = -1
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++
    else if (raw[i] === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  const jsonStr = end !== -1 ? raw.slice(start, end + 1) : raw.slice(start)
  try {
    return JSON.parse(jsonStr)
  } catch {
    // Attempt to close any open braces/brackets if truncated
    const open = (jsonStr.match(/\{/g) ?? []).length - (jsonStr.match(/\}/g) ?? []).length
    const repaired = jsonStr + '}'.repeat(Math.max(0, open))
    return JSON.parse(repaired)
  }
}

export async function generateBlogPost(topic: string, keywords: string) {
  const strategyContext = await fetchStrategyContext()
  const raw = await ask(blogPostPrompt(topic, keywords, strategyContext))
  const [html, metaSection] = raw.split('---META---')
  const meta = JSON.parse(metaSection.trim())
  return { content_html: html.trim(), ...meta }
}

export async function generateSocialPost(
  platform: 'linkedin' | 'instagram' | 'facebook',
  topic: string,
  weekTheme: string
) {
  const strategyContext = await fetchStrategyContext()
  const raw = await ask(socialPostPrompt(platform, topic, weekTheme, strategyContext))
  return extractJSON(raw) as { caption: string; hashtags: string[]; image_prompt: string }
}

export async function generateStrategy(companyName: string, location: string, services: string) {
  // Strategy is the largest response — give it maximum room
  const raw = await ask(strategyPrompt(companyName, location, services), 8192)
  return extractJSON(raw)
}

export async function generateWeeklyTopics(weekStart: string) {
  const strategyContext = await fetchStrategyContext()
  const raw = await ask(weeklyTopicsPrompt(weekStart, strategyContext), 6000)
  return extractJSON(raw) as {
    week_theme: string
    blog_topics: { topic: string; keywords: string }[]
    social_topics: { platform: 'linkedin' | 'instagram' | 'facebook'; topic: string }[]
  }
}
