import fs from "fs";
import path from "path";

// ── Company knowledge base ───────────────────────────────────────────────────

function loadCompanyContext(): string {
  try {
    const filePath = path.join(process.cwd(), "COMPANY.md");
    const raw = fs.readFileSync(filePath, "utf-8");
    return raw.replace(/^>.*$/gm, "").replace(/\[FILL IN[^\]]*\]/g, "").trim();
  } catch {
    return "";
  }
}

const COMPANY_MD = loadCompanyContext();

// ── Real Ranck posts — few-shot tone examples ────────────────────────────────

const TONE_EXAMPLES = `
## Real Ranck Post Examples (match this exact voice and style)

These are real posts Ranck has published. Study the structure, word choices, sentence length, emoji use, and hashtag patterns. Your output must feel like it came from the same person.

---
POST 1 (Facebook — tips format):
It's officially spring — and that means it's time to give your home a little extra love. Here are a few things to add to your seasonal checklist:

1️⃣ Schedule your AC tune-up before the heat hits (trust us, you don't want to wait!)
2️⃣ Check your outdoor faucets and hose bibs after the freeze/thaw cycle
3️⃣ Look for any signs of water damage from winter — ceilings, walls, and around windows
4️⃣ Test your sump pump before spring rains start
5️⃣ Clear debris from your outdoor AC unit

A little maintenance now saves a lot of headaches later.

We're here when you need us! JustCallRanck.com or (717) 912-6176

#SpringHome #HomeMaintenanceTips #LancasterPA #RanckCares #JustCallRanck
#hvacservice #plumbingservice #lancasterpa #akronpa #hersheypa #lititzpa #ephratapa

---
POST 2 (Facebook — community/team):
Big shoutout to our amazing team for another week of showing up and serving our Lancaster County neighbors.

Rain or shine. Hot or cold. They show up.

We're proud to be a local, family-owned company that Lancaster has trusted since 1953. It means everything to us.

Thank you for letting us be part of your home.

JustCallRanck.com | (717) 912-6176

#LancasterPA #TeamRanck #FamilyOwned #RanckCares #JustCallRanck #TrustRanck
#hvac #plumbing #lancasterpa #lititzpa #wyomissingpa

---
POST 3 (Facebook — seasonal urgency):
Heads up Lancaster County homeowners!

Temps are dropping fast this week and our phones are already ringing.

If your furnace hasn't been serviced this fall, now is the time. The last thing you want is to wake up to a cold house when it's 18 degrees outside.

Call us or book online. We've got you covered.

JustCallRanck.com | (717) 912-6176

#FurnaceTune #HeatingService #LancasterPA #JustCallRanck #RanckCares #TrustRanck
#hvac #furnacerepair #lancasterpa #hersheypa #ephratapa #quarryvillepa

---
POST 4 (Instagram — educational):
Your AC is trying to tell you something. Are you listening? 👂

Here are 4 signs it needs attention:

1️⃣ Warm air blowing when it should be cold
2️⃣ Unusual sounds (banging, clicking, rattling)
3️⃣ Weak airflow through your vents
4️⃣ Skyrocketing electric bills

Don't ignore the warning signs. A small issue today can turn into a big repair bill tomorrow.

We've been keeping Lancaster cool since 1953. Let us take a look.

JustCallRanck.com | (717) 912-6176

#ACRepair #LancasterPA #HomeComfort #JustCallRanck #RanckCares
#hvacservice #airconditioningrepair #lancasterpa #lititzpa #akronpa #easternyorkpa

---
POST 5 (LinkedIn — professional/trust):
70+ years. Three generations. Thousands of Lancaster County homes and businesses.

That's the Ranck story.

When we show up to your property, we're not just running a service call. We're carrying the reputation of a company that's been part of this community since 1953.

We take that seriously.

If you're a property manager or business owner looking for an HVAC and plumbing partner you can actually count on, we'd love to connect.

JustCallRanck.com | (717) 912-6176

#LancasterPA #CommercialHVAC #PropertyManagement #JustCallRanck #TrustRanck
#hvac #plumbing #lancasterpa #commercialhvac

---
POST 6 (Facebook — social proof):
We were just voted Lancaster's #1 HVAC Company for the 5th year in a row!

Honestly? We're speechless.

This is because of YOU. Our customers who trust us year after year. Our team who shows up every single day.

Lancaster, thank you. We don't take this for granted.

JustCallRanck.com | (717) 912-6176

#LancastersBest #HVAC #LancasterPA #JustCallRanck #RanckCares #TrustRanck
#hvac #lancasterpa #hersheypa #wyomissingpa #lititzpa #ephratapa

---
POST 7 (Facebook — emergency/relatable):
It's 2am. Your heat just stopped working. It's 12 degrees outside.

We've all been there. Or we know someone who has.

This is exactly why we offer 24/7 emergency service. Because home emergencies don't wait for business hours.

One call and we're on our way.

(717) 912-6176 | JustCallRanck.com

#24HourService #EmergencyHVAC #LancasterPA #JustCallRanck #RanckCares
#emergencyhvac #heatingrepair #lancasterpa #akronpa #quarryvillepa #wrightsvillepa

---
POST 8 (Instagram — behind the scenes):
Another day, another happy Lancaster homeowner. 🏡

Our team finished up a full HVAC system replacement today in Lititz and we couldn't be more proud of how it turned out.

New system, cleaner air, lower energy bills. That's the Ranck difference.

If your system is getting up there in age (10-15+ years), it might be time to talk about your options.

JustCallRanck.com | (717) 912-6176

#HVACReplacement #LancasterPA #LititzPA #JustCallRanck #RanckCares
#hvac #hvacinstall #lancasterpa #lititzpa #hersheypa

---
POST 9 (Facebook — tip of the week):
Quick tip from the Ranck team 👇

Change your air filter every 60-90 days.

That's it. That's the tip.

It sounds simple but you'd be amazed how many service calls we go on where a clogged filter is the root of the problem. Poor airflow, the system working overtime, higher bills.

Takes 5 minutes. Saves hundreds.

#HVACTips #HomeMaintenanceTips #LancasterPA #JustCallRanck #RanckCares
#hvactips #homecare #lancasterpa #ephratapa #hersheypa #lititzpa

---
POST 10 (LinkedIn — seasonal prep, commercial):
Property managers: now is the time to schedule your fall HVAC inspections.

Don't wait until your tenants call because the heat isn't working.

A pre-season inspection catches issues before they become emergencies. It keeps your tenants happy. And it protects your investment.

We work with commercial properties, apartment complexes, and businesses of all sizes across Lancaster County.

Let's get you on the schedule before the rush.

JustCallRanck.com | (717) 912-6176

#CommercialHVAC #PropertyManagement #LancasterPA #JustCallRanck #TrustRanck
#commercialhvac #propertymanagement #lancasterpa

---
POST 11 (Facebook — community/local):
Proud to serve the communities we grew up in.

Akron. Hershey. Lititz. Ephrata. Wyomissing. Quarryville. Eastern York. Wrightsville. Lebanon.

And everywhere in between.

Lancaster County, you're home. And we're honored to be your neighbor.

JustCallRanck.com | (717) 912-6176

#LancasterCounty #LancasterPA #JustCallRanck #RanckCares #TrustRanck
#lancasterpa #akronpa #hersheypa #lititzpa #ephratapa #wyomissingpa #quarryvillepa

---
POST 12 (Instagram — relatable/humor):
Homeowner: "It's making a weird noise but it's probably fine."

Us: 😬

Please don't wait until it completely breaks to call us. We promise we're not judgy.

If something feels off with your HVAC or plumbing, just give us a call. It's almost always easier (and cheaper) to fix early.

(717) 912-6176 | JustCallRanck.com

#HVACProblems #LancasterPA #JustCallRanck #RanckCares
#hvac #plumbing #lancasterpa #lititzpa #akronpa #hersheypa

---
POST 13 (Facebook — financing):
Did you know we offer flexible financing options?

A new HVAC system or major repair shouldn't have to break the bank.

We work with homeowners to find payment options that fit their budget. Because comfort shouldn't be a luxury.

Ask us about financing when you call.

JustCallRanck.com | (717) 912-6176

#HVACFinancing #LancasterPA #JustCallRanck #RanckCares
#hvac #homecomfort #lancasterpa #wyomissingpa #ephratapa #quarryvillepa

---
POST 14 (LinkedIn — company values):
We believe in doing the job right the first time.

No shortcuts. No upsells you don't need. No surprises on the invoice.

After 70 years in business, that's still our standard. And it's why our customers keep coming back.

If you're looking for an HVAC and plumbing company that treats you like a neighbor (because you are), give us a call.

JustCallRanck.com | (717) 912-6176

#LancasterPA #HVACCompany #PlumbingService #JustCallRanck #TrustRanck
#hvac #plumbing #lancasterpa #commercialhvac
`;

// ── Core system context ──────────────────────────────────────────────────────

export const SYSTEM_CONTEXT = `
You are writing social media and blog content for Ranck Plumbing, Heating, AC & Excavation — a family-owned local service company in Lancaster, PA that has been in business since 1953. They were voted Lancaster's #1 HVAC company 5 years in a row.

${COMPANY_MD ? `## Company Knowledge Base\n\n${COMPANY_MD}` : `
## Company Context
You are writing for Ranck Plumbing, Heating, AC & Excavation — a family-owned HVAC, plumbing, and excavation company in Lancaster, PA since 1953.
`}

## Voice & Style Rules (NON-NEGOTIABLE)

**NEVER use em-dashes (—) or en-dashes (–). Ever. Use a period or comma instead.**

**NEVER use these words — they are instant AI tells:**
leverage, comprehensive, seamless, robust, state-of-the-art, cutting-edge, holistic, ensure, utilize, facilitate, navigate, landscape, journey, ecosystem, innovative, transformative, game-changer, solution, dedicated, committed, prioritize, "look no further", "your comfort is our priority", "trusted professionals", "at the end of the day", "it's important to note", "when it comes to"

**Write like a real person posting from their phone, not like a copywriter:**
- Fragments are fine. "That's it." "Simple as that." "Seriously."
- Start sentences with And, But, Or — real people do this
- Use contractions always: we're, you're, don't, it's, they've, won't, isn't
- Casual openers work great: "Honest truth:", "Real talk:", "Look.", "Here's the thing."
- Vary your structure — not every post needs a hook → tips → CTA format
- It's okay to state the obvious like a human would: "You already know this, but..."
- Opinions are good: "Honestly, most people wait way too long on this."
- Humor and self-awareness: "We know, we know — nobody wants to think about their furnace."
- Specific beats vague every time: "It was 94 degrees last Tuesday" beats "during the summer heat"
- A post can just be a thought. It doesn't need to be a lesson.

**What sounds AI vs. what sounds real:**
❌ "As temperatures drop across Lancaster County, ensuring your heating system is operating at peak efficiency becomes paramount."
✅ "It's getting cold out. Is your furnace ready? Ours are booked out — just saying."

❌ "Our dedicated team of professionals is committed to delivering comprehensive HVAC solutions."
✅ "We show up, we fix it, we treat your home like it's ours."

❌ "Here are three important signs your AC unit may require attention:"
✅ "Your AC is trying to tell you something. Here's what to listen for:"

❌ "We are proud to have served the Lancaster community for over 70 years."
✅ "70 years. Still family owned. Still answering the phone."

**Contact info format (always end social posts with this):**
JustCallRanck.com | (717) 912-6176

**Brand hashtags (always include all three on social posts):**
#JustCallRanck #TrustRanck #RanckCares

**Local town hashtags (pick 3-5 relevant ones per post):**
#akronpa #hersheypa #lititzpa #ephratapa #wyomissingpa #quarryvillepa #easternyorkpa #wrightsvillepa #lebanonpa #lancasterpa

**Numbered tips use emoji numbers, not plain numbers:**
1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣

${TONE_EXAMPLES}
`;

// ── Blog post prompt ─────────────────────────────────────────────────────────

export function blogPostPrompt(topic: string, keywords: string, strategyContext = '') {
  return `${SYSTEM_CONTEXT}

${strategyContext ? `${strategyContext}\n\nApply the above strategy context to this blog post.\n` : ''}

## Task: Write a WordPress Blog Post

**Topic:** ${topic}
**Target keywords:** ${keywords}

## Requirements

**Length:** 800-1,100 words

**Voice (critical):**
- Write like a knowledgeable Lancaster County neighbor, not a content farm
- Use "we" and "our team" throughout
- Short paragraphs. Real sentences. No corporate fluff.
- No em-dashes ever. Use commas or periods instead.
- Include practical, specific advice homeowners can actually use
- Reference Lancaster County, PA Dutch Country, or local context naturally
- It should feel like it was written by someone who's been doing this work for decades

**Structure:**
- Opening hook (1-2 sentences) that speaks directly to a real homeowner concern
- 3-5 H2 sections with genuinely useful information
- At least one specific detail (a brand name, a timeframe, a local reference, a real stat)
- Closing paragraph with a single simple CTA to call or visit JustCallRanck.com

**SEO:**
- Use target keywords naturally, never stuffed
- First keyword in the first 100 words
- At least one keyword in an H2

**Format:**
Return ONLY valid inner HTML for WordPress (no <html>/<body>/<article> wrappers).
Use: <h2>, <h3>, <p>, <ul>, <li>, <strong>
The first element must be <h2> (WordPress sets the title separately).

After the HTML, add this exact separator and JSON:
---META---
{"title":"...","slug":"...","excerpt":"...","seo_title":"...","seo_description":"..."}

The excerpt should be 1-2 sentences that make someone want to read the full post.
The seo_description must be under 160 characters and include the primary keyword.
`;
}

// ── Social post prompt ───────────────────────────────────────────────────────

const PLATFORM_GUIDES: Record<string, string> = {
  linkedin: `
**Platform:** LinkedIn
**Audience:** Property managers, facility managers, business owners, commercial clients in Lancaster County
**Tone:** Professional but human. Thought leadership without being stuffy.
**Length:** 100-250 words. Short paragraphs with line breaks between every thought.
**Structure:** Hook line → blank line → 2-3 short paragraphs → contact info → hashtags
**Hashtags:** 5-8 total. Always include #JustCallRanck #TrustRanck #RanckCares. Add 2-3 relevant topic hashtags plus 2-3 local town hashtags.
**End with:** JustCallRanck.com | (717) 912-6176
`,
  instagram: `
**Platform:** Instagram
**Audience:** Homeowners, first-time buyers, Lancaster County residents
**Tone:** Warm, conversational, slightly casual. Like texting a friend who happens to be an expert.
**Length:** 80-150 words. Short punchy sentences.
**Structure:** Bold hook (1 line) → blank line → tips or story in short bursts → contact info → hashtags
**Emojis:** Use 2-4 thoughtfully. Emoji numbers (1️⃣ 2️⃣ 3️⃣) for any lists.
**Hashtags:** 10-14 total. Always include #JustCallRanck #TrustRanck #RanckCares #LancasterPA. Add topic hashtags (lowercase, e.g. #hvacservice #plumbing) plus 4-5 local town hashtags.
**End with:** JustCallRanck.com | (717) 912-6176
`,
  facebook: `
**Platform:** Facebook
**Audience:** Lancaster County homeowners, community members, neighbors
**Tone:** Friendly, local, community-first. Like a post from a neighbor you trust.
**Length:** 80-180 words. Casual but not sloppy.
**Structure:** Hook or relatable opener → short story or tips → warm close → contact info → hashtags
**Emojis:** Use 1-3 max. Emoji numbers (1️⃣ 2️⃣ 3️⃣) for any lists.
**Hashtags:** 6-10 total. Always include #JustCallRanck #TrustRanck #RanckCares #LancasterPA. Add 2-3 topic hashtags and 2-4 local town hashtags.
**End with:** JustCallRanck.com | (717) 912-6176
`,
};

export function socialPostPrompt(
  platform: "linkedin" | "instagram" | "facebook",
  topic: string,
  weekTheme: string,
  strategyContext = ''
) {
  return `${SYSTEM_CONTEXT}

${strategyContext ? `${strategyContext}\n\nThis post must align with the above strategy.\n` : ''}

## Task: Write a ${platform.charAt(0).toUpperCase() + platform.slice(1)} Post

**Post topic:** ${topic}
**Weekly theme:** ${weekTheme || "General content"}

${PLATFORM_GUIDES[platform]}

## Before you write — ask yourself:
- Would a real person actually text this to a friend? If not, rewrite it.
- Does it sound like it came from someone who's been doing this job for 30 years and loves their town? Good.
- Does it have even one word from the banned list? Cut it.
- Does every sentence earn its place, or is some of it filler? Cut the filler.
- NO em-dashes. NO AI buzzwords. Contractions everywhere.
- End with: JustCallRanck.com | (717) 912-6176
- Always include: #JustCallRanck #TrustRanck #RanckCares + 3-5 local town hashtags

## Output Format
Return JSON only — no explanation, no markdown wrapper:
{
  "caption": "the full post text with \\n for line breaks. Contact info and hashtags included.",
  "hashtags": ["hashtag1", "hashtag2"],
  "image_prompt": "a detailed prompt for a real photographic scene that matches this post — be specific about lighting, subject, setting, and mood. No text overlays."
}

Note: the hashtags array should list the hashtags separately so they can be managed individually. The caption should also include them inline at the end as Ranck formats them.
`;
}

// ── Strategy prompt ──────────────────────────────────────────────────────────

export function strategyPrompt(companyName: string, location: string, services: string) {
  return `${SYSTEM_CONTEXT}

## Task: Build a Complete Social Media Strategy

**Company:** ${companyName}
**Location:** ${location}
**Services:** ${services}

Build a strategy that is specific, actionable, and true to Ranck's authentic community-first voice. No generic advice.

Return a JSON object with this exact structure:
{
  "overview": "2-3 paragraph strategic overview specific to this company and market.",
  "target_audience": "Detailed description of 2-3 audience segments with their pain points, platforms they use, and what content resonates.",
  "brand_voice": "Specific voice guidelines with 3-5 do/don't examples and a sample sentence showing the voice in action.",
  "content_pillars": ["Pillar 1 name", "Pillar 2 name", "Pillar 3 name", "Pillar 4 name", "Pillar 5 name"],
  "daily_plan": {
    "monday": ["specific task 1", "specific task 2"],
    "tuesday": ["specific task 1"],
    "wednesday": ["specific task 1", "specific task 2"],
    "thursday": ["specific task 1"],
    "friday": ["specific task 1", "specific task 2"],
    "saturday": ["specific task 1"],
    "sunday": ["specific task 1"]
  },
  "weekly_plan": {
    "blog_posts": "Cadence and topic approach for 3 weekly blog posts",
    "linkedin": "Weekly LinkedIn strategy — post types, frequency, and what performs for this audience",
    "instagram": "Weekly Instagram strategy — visual focus, story use, reel ideas",
    "facebook": "Weekly Facebook strategy — community focus, local engagement",
    "content_mix": "How the 5 content pillars map across the week's posts"
  },
  "monthly_plan": {
    "week1": "Theme and focus for week 1",
    "week2": "Theme and focus for week 2",
    "week3": "Theme and focus for week 3",
    "week4": "Theme and focus for week 4",
    "monthly_theme_examples": ["Month: Theme — rationale", "Month: Theme — rationale", "Month: Theme — rationale", "Month: Theme — rationale"]
  }
}
`;
}

// ── Weekly topics prompt ─────────────────────────────────────────────────────

export function weeklyTopicsPrompt(weekStart: string, strategyContext = '') {
  return `${SYSTEM_CONTEXT}

${strategyContext ? `${strategyContext}\n\nThe week plan must serve this strategy.\n` : ''}

## Task: Plan a Full Week of Content

**Week starting:** ${weekStart}

Generate a cohesive weekly content plan. All topics should connect to a single weekly theme.

- Mix educational, trust-building, community, seasonal, and (sparingly) promotional content
- Each blog post should be a topic a Lancaster County homeowner would actually search for
- Social posts should complement the blog content, not repeat it
- Topics should feel like they could have come from the real Ranck posts above

Return JSON only:
{
  "week_theme": "A specific, punchy theme for the week (e.g. 'Get Ready Before the Rush' or 'Your Spring Plumbing Checklist')",
  "blog_topics": [
    {"topic": "specific blog title or angle", "keywords": "primary keyword, secondary keyword, tertiary keyword"},
    {"topic": "specific blog title or angle", "keywords": "primary keyword, secondary keyword, tertiary keyword"},
    {"topic": "specific blog title or angle", "keywords": "primary keyword, secondary keyword, tertiary keyword"}
  ],
  "social_topics": [
    {"platform": "linkedin", "topic": "specific angle + post type (e.g. tips list, story, thought leadership)"},
    {"platform": "linkedin", "topic": "specific angle + post type"},
    {"platform": "linkedin", "topic": "specific angle + post type"},
    {"platform": "instagram", "topic": "specific angle + post type"},
    {"platform": "instagram", "topic": "specific angle + post type"},
    {"platform": "instagram", "topic": "specific angle + post type"},
    {"platform": "facebook", "topic": "specific angle + post type"},
    {"platform": "facebook", "topic": "specific angle + post type"},
    {"platform": "facebook", "topic": "specific angle + post type"}
  ]
}
`;
}
