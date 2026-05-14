import { Router } from "express";
import { getClient, AI_MODEL, AI_KEY_COUNT } from "@workspace/integrations-openai-ai-server";
import {
  AiResearchProductsBody,
  AiFindSuppliersBody,
  AiGenerateContentBody,
  AiGenerateListingBody,
} from "@workspace/api-zod";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJson(text: string): unknown {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── Image URL helper ─────────────────────────────────────────────────────────
// Uses loremflickr.com — real photos, no API key needed, consistent per product
function getProductImageUrl(searchQuery: string): string {
  const keywords = searchQuery
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(",");
  let hash = 0;
  for (const ch of searchQuery) hash = ((hash * 31) + ch.charCodeAt(0)) & 0x7fffffff;
  return `https://loremflickr.com/400/400/${keywords || "product"}?lock=${hash}`;
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

/**
 * Round-robin key rotation with automatic 429 retry.
 * On rate-limit, skips to the next key and retries — tries every key once.
 */
async function aiChat(messages: Msg[], maxTokens = 4096) {
  let lastErr: unknown;
  const attempts = Math.max(AI_KEY_COUNT, 1);
  for (let i = 0; i < attempts; i++) {
    try {
      const { client, model } = i === 0 ? getClient() : getClient(true);
      return await client.chat.completions.create({
        model,
        messages,
        max_completion_tokens: maxTokens,
        stream: false,
      });
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 429) { lastErr = err; continue; }
      throw err;
    }
  }
  throw lastErr;
}

// ─── Research Products ───────────────────────────────────────────────────────

router.post("/ai/research-products", async (req, res) => {
  const parsed = AiResearchProductsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { niche, budget, count = 5 } = parsed.data;
  const budgetClause = budget ? ` Sourcing budget: under $${budget}/unit.` : "";

  const response = await aiChat([
    {
      role: "system",
      content: `You are a top-performing TikTok Shop dropshipper who has generated over $2M in sales.
You know exactly which products are exploding on TikTok right now, why they go viral, and how to price them for maximum profit.
You always respond with valid JSON only — no markdown, no explanation.`,
    },
    {
      role: "user",
      content: `Find ${count} HIGH-PROFIT trending products for TikTok dropshipping in the "${niche}" niche.${budgetClause}

Rules:
- Only include products that are currently trending or have strong upward momentum on TikTok
- Products must have at least 60% profit margin potential
- Focus on products that create strong emotional reactions (wow factor, problem-solving, aesthetics)
- Be SPECIFIC — use real product names, not vague descriptions

Return ONLY this JSON:
{
  "ideas": [
    {
      "name": "Specific product name",
      "description": "Compelling 2-sentence description that highlights the wow factor",
      "category": "Category",
      "estimatedCost": 8.50,
      "estimatedSellingPrice": 34.99,
      "profitMargin": 75,
      "trendScore": 88,
      "competitionLevel": "low",
      "monthlyRevenuePotential": "$3,000–$8,000",
      "whyItWorks": "Specific reason this product is viral on TikTok right now",
      "targetAudience": "Very specific demographic",
      "viralAngles": ["Angle 1 — specific video concept", "Angle 2", "Angle 3"],
      "trendingHooks": ["Hook line 1 that stops scroll", "Hook line 2", "Hook line 3"],
      "sourcingTip": "Specific search term to use on CJDropshipping, AliExpress, or Alibaba",
      "riskLevel": "low"
    }
  ]
}`,
    },
  ], 6000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try {
    const data = parseJson(text) as { ideas?: Record<string, unknown>[] };
    // Attach auto-fetched image URL to each idea
    if (Array.isArray(data.ideas)) {
      for (const idea of data.ideas) {
        const q = (idea.imageSearchQuery as string) || (idea.name as string) || "product";
        idea.imageUrl = getProductImageUrl(q);
      }
    }
    res.json(data);
  }
  catch { req.log.error({ text }, "Failed to parse AI research response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

// ─── Find Suppliers ───────────────────────────────────────────────────────────

router.post("/ai/find-suppliers", async (req, res) => {
  const parsed = AiFindSuppliersBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { productName, productCategory, count = 5 } = parsed.data;

  const response = await aiChat([
    {
      role: "system",
      content: `You are a dropshipping sourcing expert who knows every major supplier platform including Alibaba, AliExpress, CJDropshipping, Zendrop, and Spocket.
You help TikTok sellers find reliable, fast-shipping suppliers with great margins.
Always include Alibaba as an option for bulk or private-label potential.
Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `Find ${count} supplier options for "${productName}" (category: ${productCategory}) optimized for TikTok Shop dropshipping.

Include a mix of platforms: CJDropshipping or Zendrop (fastest shipping), AliExpress (widest selection), and Alibaba (bulk / private label / best unit cost at scale).
Prioritize: fast shipping, low MOQ, good reviews, TikTok Shop compatible.

Return ONLY this JSON:
{
  "suppliers": [
    {
      "name": "Specific store or supplier name",
      "platform": "CJDropshipping/AliExpress/Alibaba/Zendrop/Spocket/etc",
      "url": "https://specific-search-url.com",
      "productCategory": "${productCategory}",
      "rating": 4.8,
      "minOrderQuantity": 1,
      "shippingTime": "7–12 days",
      "notes": "Key advantages of this supplier",
      "whyRecommended": "Specific reason great for TikTok dropshipping"
    }
  ]
}`,
    },
  ]);

  const text = response.choices[0]?.message?.content ?? "{}";
  try { res.json(parseJson(text)); }
  catch { req.log.error({ text }, "Failed to parse AI supplier response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

// ─── Generate Content ─────────────────────────────────────────────────────────

router.post("/ai/generate-content", async (req, res) => {
  const parsed = AiGenerateContentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { productName, productDescription, contentType, targetAudience, tone = "trendy" } = parsed.data;
  const audienceClause = targetAudience ? ` Target audience: ${targetAudience}.` : "";

  const typeInstructions: Record<string, string> = {
    caption: "a TikTok caption (max 150 chars, punchy, curiosity-driving, ends with CTA)",
    script: `a TikTok video script (15–30 seconds).
- Hook (0–3s): scroll-stopping opening line
- Problem/desire (3–10s): agitate the pain or desire
- Solution (10–20s): introduce the product naturally
- CTA (20–30s): urgent call to action
Format as: HOOK: ... | BODY: ... | CTA: ...`,
    hooks: `5 different scroll-stopping hook lines for a TikTok video.
Each hook must make someone stop scrolling in the first 3 seconds.
Use proven formats: POV, numbers, controversy, "this changed my life", ASMR cues, etc.`,
    full_campaign: `a complete TikTok campaign package:
1. 3 hook line variants
2. Full 30-second video script
3. Caption with CTA
4. 5 posting tips specific to this product`,
  };

  const response = await aiChat([
    {
      role: "system",
      content: `You are a viral TikTok content creator who consistently hits 1M+ views.
You know the exact psychological triggers, pacing, and hooks that stop the scroll and drive purchases.
Tone: ${tone}. Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `Create ${typeInstructions[contentType] ?? "TikTok marketing content"} for this product:
Product: ${productName}
Description: ${productDescription}${audienceClause}

Return ONLY this JSON:
{
  "content": "The main content",
  "hashtags": "#TikTokShop #viral #hashtag3 #hashtag4 #hashtag5 #hashtag6",
  "tips": "2–3 specific tips to maximize views and conversions for this exact product"
}`,
    },
  ], 3000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try { res.json(parseJson(text)); }
  catch { req.log.error({ text }, "Failed to parse AI content response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

// ─── Generate Listing ─────────────────────────────────────────────────────────

router.post("/ai/generate-listing", async (req, res) => {
  const parsed = AiGenerateListingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { productName, productDescription, targetAudience, keyFeatures } = parsed.data;

  const response = await aiChat([
    {
      role: "system",
      content: `You are a TikTok Shop listing specialist with an 8% average conversion rate.
You write listings that rank, convert, and make buyers feel like they'd be crazy NOT to buy.
Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `Write a high-converting TikTok Shop listing for:
Product: ${productName}
Description: ${productDescription}${targetAudience ? ` Target: ${targetAudience}.` : ""}${keyFeatures ? ` Features: ${keyFeatures}.` : ""}

Return ONLY this JSON:
{
  "title": "SEO-optimized title under 80 chars — include top keywords",
  "description": "3 paragraphs: 1) Hook + problem, 2) Product solution + features, 3) Social proof angle + urgency",
  "bulletPoints": ["Benefit-focused point 1", "Benefit 2", "Benefit 3", "Benefit 4", "Benefit 5"],
  "hashtags": "#TikTokShop #hashtag2 #hashtag3 #hashtag4 #hashtag5",
  "callToAction": "Urgent, specific CTA that drives immediate purchase"
}`,
    },
  ], 3000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try { res.json(parseJson(text)); }
  catch { req.log.error({ text }, "Failed to parse AI listing response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

// ─── Trending Niches ──────────────────────────────────────────────────────────

router.post("/ai/trending-niches", async (_req, res) => {
  const response = await aiChat([
    {
      role: "system",
      content: `You are a TikTok Shop trend analyst. You know exactly what niches are hot, which are saturated, and where the money is right now. Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `List 8 trending niches for TikTok dropshipping right now (current market conditions).
Mix of: proven evergreen niches + emerging high-opportunity niches.

Return ONLY this JSON:
{
  "niches": [
    {
      "name": "Niche name",
      "emoji": "🔥",
      "description": "One-sentence description of opportunity",
      "opportunityScore": 88,
      "competitionLevel": "low",
      "avgProfitMargin": 72,
      "whyNow": "Why this is hot RIGHT NOW — specific reason",
      "exampleProducts": ["Specific product 1", "Specific product 2", "Specific product 3"]
    }
  ]
}`,
    },
  ], 3000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try { res.json(parseJson(text)); }
  catch { _req.log.error({ text }, "Failed to parse trending niches response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

// ─── Product Analysis ─────────────────────────────────────────────────────────

router.post("/ai/product-analysis", async (req, res) => {
  const { productName, productDescription, estimatedCost, estimatedSellingPrice } = req.body as {
    productName: string;
    productDescription: string;
    estimatedCost?: number;
    estimatedSellingPrice?: number;
  };
  if (!productName) { res.status(400).json({ error: "productName is required" }); return; }

  const response = await aiChat([
    {
      role: "system",
      content: `You are a TikTok Shop business consultant who has helped 100+ sellers scale to $10K/month.
You provide brutally honest, data-driven launch plans. Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `Create a complete business analysis and launch plan for:
Product: ${productName}
Description: ${productDescription}${estimatedCost ? ` Sourcing cost: $${estimatedCost}. Selling price: $${estimatedSellingPrice ?? "TBD"}.` : ""}

Return ONLY this JSON:
{
  "verdict": "BUY / PASS / RISKY",
  "verdictReason": "1-2 sentence honest verdict on this product's potential",
  "opportunityScore": 82,
  "businessPlan": {
    "targetMonthlyRevenue": "$4,000–$8,000",
    "launchBudget": "$200–$500",
    "breakEvenUnits": 45,
    "projectedROI": "340%",
    "timeToFirstSale": "3–7 days"
  },
  "pricingStrategy": {
    "recommendedPrice": 34.99,
    "psychologicalPricePoint": "$34.99 beats $35 — anchors under threshold",
    "bundleIdea": "Bundle with X for $49.99 to increase AOV"
  },
  "launchPlan": [
    { "week": 1, "focus": "Content testing", "actions": ["Post 3 videos with different hooks", "Test 2 audiences", "Order 5 units"] },
    { "week": 2, "focus": "Scale winners", "actions": ["Double down on best-performing hook", "Add UGC testimonial"] },
    { "week": 3, "focus": "Optimize & automate", "actions": ["Run TikTok ads on best video", "Set up email follow-up"] }
  ],
  "contentAngles": [
    { "angle": "Angle name", "hook": "Exact hook line", "format": "Video format description" },
    { "angle": "Angle 2", "hook": "Hook line 2", "format": "Format 2" },
    { "angle": "Angle 3", "hook": "Hook line 3", "format": "Format 3" }
  ],
  "risks": ["Risk 1", "Risk 2"],
  "competitorWeaknesses": "What existing sellers are doing wrong that you can exploit",
  "winningStrategy": "The single most important thing to do to succeed with this product"
}`,
    },
  ], 6000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try { res.json(parseJson(text)); }
  catch { req.log.error({ text }, "Failed to parse product analysis response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

// ─── Autopilot ────────────────────────────────────────────────────────────────

router.post("/ai/autopilot", async (req, res) => {
  const { productName, productDescription, targetAudience } = req.body as {
    productName: string;
    productDescription: string;
    targetAudience?: string;
  };
  if (!productName) { res.status(400).json({ error: "productName is required" }); return; }

  const response = await aiChat([
    {
      role: "system",
      content: `You are an AI dropshipping autopilot. In one shot, you generate everything a seller needs to launch a product immediately: suppliers and ready-to-post TikTok content. Be specific, actionable, and optimized for maximum conversions. Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `Generate a complete launch package for:
Product: ${productName}
Description: ${productDescription}${targetAudience ? ` Target audience: ${targetAudience}.` : ""}

Return ONLY this JSON:
{
  "suppliers": [
    {
      "name": "Supplier name",
      "platform": "Platform",
      "url": "https://url.com",
      "shippingTime": "7–12 days",
      "rating": 4.8,
      "minOrderQuantity": 1,
      "notes": "Why use this supplier"
    }
  ],
  "contentPieces": [
    {
      "title": "Caption",
      "contentType": "caption",
      "content": "Full caption text",
      "hashtags": "#TikTokShop #hashtags",
      "hook": "The scroll-stopping first line"
    },
    {
      "title": "Video Script",
      "contentType": "script",
      "content": "HOOK: ... | BODY: ... | CTA: ...",
      "hashtags": "#hashtags",
      "hook": "Hook line"
    },
    {
      "title": "Hook Lines Pack",
      "contentType": "hooks",
      "content": "1. Hook\\n2. Hook\\n3. Hook\\n4. Hook\\n5. Hook",
      "hashtags": "#hashtags",
      "hook": "Best hook from the 5"
    }
  ],
  "launchChecklist": [
    "Order 3–5 sample units from top supplier",
    "Film unboxing + reaction video within 48h of arrival",
    "Post hooks pack first — test which gets most engagement",
    "Set price at psychological anchor point",
    "Reply to every comment in first hour for algorithm boost"
  ]
}`,
    },
  ], 6000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try { res.json(parseJson(text)); }
  catch { req.log.error({ text }, "Failed to parse autopilot response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

// ─── Discover — zero-input trending products ──────────────────────────────────

router.post("/ai/discover", async (req, res) => {
  const response = await aiChat([
    {
      role: "system",
      content: `You are a TikTok Shop expert who monitors viral trends daily and has helped 500+ sellers find winning products. You know exactly what is selling on TikTok RIGHT NOW — not yesterday, not last month. You respond only with valid JSON.`,
    },
    {
      role: "user",
      content: `I want to start dropshipping on TikTok Shop TODAY. What 5 products should I sell right now to make money within 30 days?

Requirements:
- Products that are actively going viral on TikTok right now
- Can be sourced from AliExpress, CJDropshipping, or Alibaba for under $15
- Have at least 65% profit margin
- Have an obvious, easy-to-film TikTok content angle
- Real, specific product names — not just "LED lights" but exactly what type
- Mix of different niches for variety

Return ONLY this JSON:
{
  "marketContext": "1-2 sentences on what's trending on TikTok Shop right now and why",
  "products": [
    {
      "name": "Very specific product name",
      "emoji": "🔥",
      "category": "Category",
      "description": "Why this product is blowing up — specific and compelling",
      "whyNow": "Exactly why this is the moment to sell this — trend, season, viral moment",
      "estimatedCost": 7.50,
      "estimatedSellingPrice": 29.99,
      "profitMargin": 75,
      "trendScore": 92,
      "viralAngle": "The single best TikTok video concept for this product",
      "firstHook": "The exact first line to say in your first video",
      "sourcingKeyword": "Exact search term to use on AliExpress, CJDropshipping, or Alibaba"
    }
  ]
}`,
    },
  ], 5000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try {
    const data = parseJson(text) as { products?: Record<string, unknown>[] };
    if (Array.isArray(data.products)) {
      for (const p of data.products) {
        const q = (p.imageSearchQuery as string) || (p.name as string) || "product";
        p.imageUrl = getProductImageUrl(q);
      }
    }
    res.json(data);
  }
  catch { req.log.error({ text }, "Failed to parse discover response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

// ─── Marketing Strategy ───────────────────────────────────────────────────────

router.post("/ai/marketing-strategy", async (req, res) => {
  const { productName, productDescription, budget, goal } = req.body as {
    productName: string;
    productDescription: string;
    budget?: string;
    goal?: string;
  };
  if (!productName) { res.status(400).json({ error: "productName is required" }); return; }

  const response = await aiChat([
    {
      role: "system",
      content: `You are a TikTok Shop growth strategist who has taken brands from $0 to $50K/month. You give brutally specific, actionable marketing strategies — not generic advice. You know the TikTok algorithm, what content converts, and how to scale profitably. You respond only with valid JSON.`,
    },
    {
      role: "user",
      content: `Create a complete TikTok marketing strategy for:
Product: ${productName}
Description: ${productDescription}${budget ? `\nBudget: ${budget}` : ""}${goal ? `\nGoal: ${goal}` : ""}

Be hyper-specific. Give exact tactics, not vague suggestions.

Return ONLY this JSON:
{
  "summary": "2-sentence executive summary of the strategy",
  "targetAudience": {
    "primary": "Most specific possible description of primary buyer",
    "secondary": "Secondary audience",
    "psychographics": "What motivates them to buy",
    "bestTimeToReach": "When they're most active on TikTok"
  },
  "contentStrategy": {
    "postingFrequency": "X posts per day",
    "contentMix": {
      "hooks": "40% — scroll-stopping problem/solution openers",
      "demos": "30% — showing the product in action",
      "testimonials": "20% — UGC-style reactions",
      "trending": "10% — riding trending sounds/formats"
    },
    "bestFormats": ["Format 1 with why it works", "Format 2", "Format 3"],
    "videoLength": "Optimal video length and why",
    "bestPostingTimes": ["7-9am local", "12-2pm", "7-10pm"]
  },
  "weeklyPlan": [
    { "week": 1, "theme": "Launch & Test", "goal": "Find winning hook", "dailyActions": ["Action 1", "Action 2", "Action 3"], "successMetric": "At least 1 video reaching 10K views" },
    { "week": 2, "theme": "Double Down", "goal": "Scale what works", "dailyActions": ["Action 1", "Action 2"], "successMetric": "First 10 sales" },
    { "week": 3, "theme": "Community & UGC", "goal": "Social proof", "dailyActions": ["Action 1", "Action 2"], "successMetric": "3+ UGC videos" },
    { "week": 4, "theme": "Paid Amplification", "goal": "Scale with ads", "dailyActions": ["Action 1", "Action 2"], "successMetric": "$1K revenue" }
  ],
  "tiktokTactics": [
    "Specific TikTok tactic 1",
    "Specific tactic 2",
    "Specific tactic 3",
    "Specific tactic 4",
    "Specific tactic 5"
  ],
  "hashtagStrategy": {
    "niche": ["#niche1", "#niche2", "#niche3"],
    "broad": ["#TikTokShop", "#tiktokmademebuyit", "#viral"],
    "trending": "Check TikTok trending weekly and add 2-3 relevant ones",
    "tip": "Use 3-5 niche + 2-3 broad hashtags per post — avoid hashtag stuffing"
  },
  "budgetAllocation": {
    "organic": "First 2 weeks: $0 — build organic proof first",
    "tiktokSpark": "Week 3: $5-10/day boosting best organic video",
    "tiktokAds": "Week 4+: $20-50/day once you have a proven creative",
    "ugcCreators": "Optional: $50-200 for micro-influencer posts"
  },
  "kpis": [
    "Video watch rate > 50%",
    "Profile visit rate > 5%",
    "Click-through rate > 2%",
    "Conversion rate > 1.5%"
  ]
}`,
    },
  ], 6000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try { res.json(parseJson(text)); }
  catch { req.log.error({ text }, "Failed to parse marketing strategy response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

// ─── Content Calendar ─────────────────────────────────────────────────────────

router.post("/ai/content-calendar", async (req, res) => {
  const { productName, productDescription, postsPerDay = 2 } = req.body as {
    productName: string;
    productDescription: string;
    postsPerDay?: number;
  };
  if (!productName) { res.status(400).json({ error: "productName is required" }); return; }

  const response = await aiChat([
    {
      role: "system",
      content: `You are a TikTok content strategist who creates viral posting calendars for dropshippers. Every day of your calendar has a different angle, format, and hook — never repetitive. You respond only with valid JSON.`,
    },
    {
      role: "user",
      content: `Create a 7-day TikTok content calendar for:
Product: ${productName}
Description: ${productDescription}
Posts per day: ${postsPerDay}

Make each day completely different. Include exact hooks, specific topics, and posting times.

Return ONLY this JSON:
{
  "weekSummary": "What this week accomplishes and why this order works",
  "days": [
    {
      "day": 1,
      "theme": "Day theme name",
      "posts": [
        {
          "time": "7:30am",
          "contentType": "hook video / demo / testimonial / trending / educational",
          "hook": "EXACT first line to say on camera",
          "topic": "Specific topic and what to show",
          "script": "30-word outline of what to say/show",
          "hashtags": "#hashtag1 #hashtag2 #hashtag3",
          "expectedOutcome": "What this post should achieve"
        }
      ]
    }
  ],
  "proTips": [
    "Specific tip 1 for this product's content",
    "Tip 2",
    "Tip 3"
  ]
}`,
    },
  ], 7000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try { res.json(parseJson(text)); }
  catch { req.log.error({ text }, "Failed to parse content calendar response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

// ─── Full Launch — zero-input complete product launch package ─────────────────
// The "do everything for me" endpoint. Returns 4 products with images, pricing,
// suppliers, hooks, video scripts, and listing copy — ready to save in one click.

router.post("/ai/full-launch", async (req, res) => {
  const response = await aiChat([
    {
      role: "system",
      content: `You are a veteran TikTok Shop dropshipping expert who has generated over $10M in combined student revenue. You know EXACTLY what is selling on TikTok Shop RIGHT NOW. You think like a product researcher, copywriter, and marketer simultaneously.

You give brutally specific, real information:
- Actual product names that exist on AliExpress, CJDropshipping, or Alibaba
- Psychologically optimized prices (e.g. $29.99, not $30)
- Hook lines that ACTUALLY stop the scroll
- Real supplier search URLs for AliExpress, CJDropshipping, AND Alibaba
- Descriptions that make people click "Add to Cart" immediately

You respond only with valid JSON — no markdown, no commentary.`,
    },
    {
      role: "user",
      content: `Find me 4 trending products I can start selling on TikTok Shop TODAY with everything I need to launch — no additional research required.

Requirements:
- Currently trending or viral on TikTok (think: #tiktokmademebuyit, TikTok Shop bestsellers)
- Source for under $12, sell for $20–$55
- At least 65% profit margin potential
- Easy to create TikTok content for — visual wow factor, emotional reaction, or satisfying demo
- Mix of different niches (beauty, home, tech, lifestyle, etc.)
- Real products that exist on AliExpress, CJDropshipping, or Alibaba

Return ONLY this JSON — all fields are required:
{
  "products": [
    {
      "name": "Very specific product name (e.g. 'Magnetic Levitating Moon Lamp' not just 'LED lamp')",
      "emoji": "🔥",
      "category": "Exact category",
      "shortDescription": "One punchy sentence that makes someone want to buy immediately",
      "fullDescription": "3 sentences: what it is + why it's special + who it's for. SEO-friendly, compelling, no fluff.",
      "sellingPoints": [
        "Specific benefit or feature 1",
        "Specific benefit or feature 2",
        "Specific benefit or feature 3",
        "Shipping/fulfillment advantage",
        "Social proof or trend angle"
      ],
      "sourcingPrice": 8.50,
      "tiktokShopPrice": 34.99,
      "flashSalePrice": 27.99,
      "competitorAmazonPrice": 49.99,
      "profitPerUnit": 26.49,
      "profitMargin": 76,
      "trendScore": 91,
      "monthlyRevenue": "$4,200/mo selling 5 units/day",
      "imageSearchQuery": "specific product photo search keywords (2-4 words)",
      "aliexpressSearchUrl": "https://www.aliexpress.com/wholesale?SearchText=PRODUCT+KEYWORDS",
      "cjSearchUrl": "https://cjdropshipping.com/search?q=PRODUCT+KEYWORDS",
      "alibabaUrl": "https://www.alibaba.com/trade/search?SearchText=PRODUCT+KEYWORDS",
      "targetAudience": "Very specific demographic and psychographic",
      "hooks": [
        "I spent $8 and made $400 this week — here's what I sold",
        "POV: you finally found a winning TikTok Shop product",
        "The product everyone is ordering but nobody is selling yet",
        "This thing cost me $8 to buy and I sell it for $35",
        "Why is this [product] going viral on TikTok Shop?"
      ],
      "videoScript": "HOOK (0-3s): [Exact line to say with exact action] | DEMO (3-15s): [Step by step what to show on camera] | REVEAL (15-20s): [The wow moment] | CTA (20-25s): [Exact words to say to drive clicks]",
      "hashtags": "#TikTokShop #tiktokmademebuyit #viral #[niche] #[product]",
      "suppliers": [
        {
          "name": "Specific store name on the platform",
          "platform": "CJDropshipping",
          "url": "https://cjdropshipping.com/search?q=keywords",
          "shippingTime": "8-12 days to US",
          "rating": 4.8,
          "minOrderQuantity": 1,
          "notes": "Why this supplier is best for TikTok Shop"
        },
        {
          "name": "Backup supplier name",
          "platform": "AliExpress",
          "url": "https://www.aliexpress.com/wholesale?SearchText=keywords",
          "shippingTime": "10-15 days to US",
          "rating": 4.6,
          "minOrderQuantity": 1,
          "notes": "Good backup with slightly longer shipping"
        }
      ]
    }
  ]
}`,
    },
  ], 8000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try {
    const data = parseJson(text) as { products?: Record<string, unknown>[] };
    if (Array.isArray(data.products)) {
      for (const p of data.products) {
        const q = (p.imageSearchQuery as string) || (p.name as string) || "product";
        p.imageUrl = getProductImageUrl(q);
      }
    }
    res.json(data);
  }
  catch { req.log.error({ text }, "Failed to parse full-launch response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

// ─── Ask AI ───────────────────────────────────────────────────────────────────

router.post("/ai/ask", async (req, res) => {
  const { message } = req.body as { message: string };
  if (!message?.trim()) { res.status(400).json({ error: "message is required" }); return; }

  const response = await aiChat([
    {
      role: "system",
      content: `You are a TikTok Shop dropshipping expert with 7+ years of experience making $200K+/year.
You know everything about:
- Finding and validating winning products
- TikTok marketing, viral content, and the algorithm
- Supplier sourcing (AliExpress, CJDropshipping, Zendrop, Alibaba)
- Pricing strategy and profit maximization
- Scaling from side hustle to full-time income
- Customer service, returns, and operations
- TikTok ads, Spark Ads, and paid amplification
- Competitor analysis and market research

Give specific, actionable advice — not generic tips. Use real numbers and real examples.
If asked about trends, give your best analysis of what's working right now.
Always end with 2-3 action items the user can do TODAY.
Respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `${message}

Return ONLY this JSON:
{
  "answer": "Your full detailed answer — be specific, use examples, give real numbers",
  "actionItems": ["Do this today: specific action 1", "Specific action 2", "Specific action 3"],
  "followUpQuestions": ["Relevant follow-up question 1?", "Follow-up 2?", "Follow-up 3?"]
}`,
    },
  ], 4000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try { res.json(parseJson(text)); }
  catch { req.log.error({ text }, "Failed to parse ask response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

export default router;
