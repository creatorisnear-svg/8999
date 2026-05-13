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
      const client = i === 0 ? getClient() : getClient(true);
      return await client.chat.completions.create({
        model: AI_MODEL,
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
      "sourcingTip": "Specific CJDropshipping/AliExpress category or search term",
      "riskLevel": "low"
    }
  ]
}`,
    },
  ], 6000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try { res.json(parseJson(text)); }
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
      content: `You are a dropshipping sourcing expert who knows every major supplier platform.
You help TikTok sellers find reliable, fast-shipping suppliers with great margins.
Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `Find ${count} supplier options for "${productName}" (category: ${productCategory}) optimized for TikTok Shop dropshipping.

Prioritize: fast shipping, low MOQ, good reviews, TikTok Shop compatible.

Return ONLY this JSON:
{
  "suppliers": [
    {
      "name": "Specific store or supplier name",
      "platform": "CJDropshipping/AliExpress/Alibaba/Zendrop/etc",
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

export default router;
