import { Router } from "express";
import { getClient, getAiKeyCount } from "@workspace/integrations-openai-ai-server";
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

// ─── Image URL ────────────────────────────────────────────────────────────────
// Uses Unsplash source API — keyword-aware, gives relevant product-style photos.
function getProductImageUrl(searchQuery: string): string {
  const keywords = searchQuery
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(",");
  return `https://source.unsplash.com/400x400/?${encodeURIComponent(keywords || "product")}`;
}

// ─── Supplier URL builder ─────────────────────────────────────────────────────
// Builds REAL, working search URLs from product keywords.
// The AI should never be asked to generate URLs directly — it hallucinates them.
function buildSupplierUrl(platform: string, searchKeyword: string): string {
  const encoded = encodeURIComponent(searchKeyword.trim());
  const p = platform.toLowerCase();
  if (p.includes("aliexpress")) return `https://www.aliexpress.com/wholesale?SearchText=${encoded}`;
  if (p.includes("cj") || p.includes("cjdrop")) return `https://cjdropshipping.com/search?q=${encoded}`;
  if (p.includes("alibaba")) return `https://www.alibaba.com/trade/search?SearchText=${encoded}`;
  if (p.includes("zendrop")) return `https://app.zendrop.com/sourcing?query=${encoded}`;
  if (p.includes("spocket")) return `https://app.spocket.co/products?search=${encoded}`;
  if (p.includes("temu")) return `https://www.temu.com/search_result.html?search_key=${encoded}`;
  if (p.includes("amazon")) return `https://www.amazon.com/s?k=${encoded}`;
  // fallback: AliExpress
  return `https://www.aliexpress.com/wholesale?SearchText=${encoded}`;
}

// ─── AI chat helper ───────────────────────────────────────────────────────────

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function aiChat(messages: Msg[], maxTokens = 4096) {
  let lastErr: unknown;
  const attempts = Math.max(getAiKeyCount(), 1);
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
  const budgetClause = budget ? ` Maximum sourcing cost: $${budget}/unit.` : "";

  const response = await aiChat([
    {
      role: "system",
      content: `You are a top-performing TikTok Shop dropshipper who generates $50K+/month. You know exactly which products are exploding on TikTok RIGHT NOW, why they go viral, and how to price them for maximum profit. You only recommend products you can personally verify exist on AliExpress, CJDropshipping, or Alibaba. You always respond with valid JSON only — no markdown, no explanation.`,
    },
    {
      role: "user",
      content: `Find ${count} HIGH-PROFIT trending products for TikTok dropshipping in the "${niche}" niche.${budgetClause}

Requirements (strict):
- Currently trending or gaining traction on TikTok Shop right now
- At least 60% profit margin potential
- Strong visual wow factor, satisfying demo, or emotional trigger — easy to film
- Be VERY specific: real product names, not generic descriptions
- Include an exact search term to find it on AliExpress or CJDropshipping

Return ONLY this JSON (no markdown):
{
  "ideas": [
    {
      "name": "Very specific product name",
      "description": "Compelling 2-sentence description highlighting wow factor and why people buy",
      "category": "Category",
      "estimatedCost": 8.50,
      "estimatedSellingPrice": 34.99,
      "profitMargin": 75,
      "trendScore": 88,
      "competitionLevel": "low",
      "monthlyRevenuePotential": "$3,000–$8,000",
      "whyItWorks": "Specific reason this product is going viral on TikTok right now",
      "targetAudience": "Very specific demographic (age, interest, pain point)",
      "viralAngles": ["Specific video concept 1", "Video concept 2", "Video concept 3"],
      "trendingHooks": ["Exact scroll-stopping line 1", "Hook line 2", "Hook line 3"],
      "sourcingTip": "Exact search keyword to use on AliExpress or CJDropshipping",
      "imageSearchQuery": "2-4 word product photo search query",
      "riskLevel": "low"
    }
  ]
}`,
    },
  ], 6000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try {
    const data = parseJson(text) as { ideas?: Record<string, unknown>[] };
    if (Array.isArray(data.ideas)) {
      for (const idea of data.ideas) {
        const q = (idea.imageSearchQuery as string) || (idea.name as string) || "product";
        idea.imageUrl = getProductImageUrl(q);
        // Build real supplier search links from the sourcing tip
        const keyword = (idea.sourcingTip as string) || (idea.name as string) || "";
        idea.aliexpressUrl = buildSupplierUrl("aliexpress", keyword);
        idea.cjUrl = buildSupplierUrl("cjdropshipping", keyword);
      }
    }
    res.json(data);
  } catch {
    req.log.error({ text }, "Failed to parse AI research response");
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

// ─── Find Suppliers ───────────────────────────────────────────────────────────

router.post("/ai/find-suppliers", async (req, res) => {
  const parsed = AiFindSuppliersBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { productName, productCategory, count = 5 } = parsed.data;

  const response = await aiChat([
    {
      role: "system",
      content: `You are a dropshipping sourcing expert who knows AliExpress, CJDropshipping, Zendrop, Spocket, and Alibaba deeply. You help TikTok sellers find reliable, fast-shipping suppliers. Never make up specific store URLs — provide real search keywords instead. Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `Find ${count} supplier options for "${productName}" (category: ${productCategory}) optimized for TikTok Shop dropshipping.

Include a mix: CJDropshipping or Zendrop (fast US shipping), AliExpress (widest selection), and Alibaba (bulk/private label).
For each supplier, give a REAL search keyword that will actually find this product on that platform.

Return ONLY this JSON:
{
  "suppliers": [
    {
      "name": "Type of supplier (e.g. CJDropshipping seller, AliExpress store)",
      "platform": "CJDropshipping",
      "searchKeyword": "exact keyword to search on this platform to find the product",
      "productCategory": "${productCategory}",
      "rating": 4.8,
      "minOrderQuantity": 1,
      "shippingTime": "7–12 days to US",
      "notes": "Key advantages for TikTok Shop (fast shipping, no min order, good packaging)",
      "whyRecommended": "Specific reason this platform is great for this exact product"
    }
  ]
}`,
    },
  ]);

  const text = response.choices[0]?.message?.content ?? "{}";
  try {
    const data = parseJson(text) as { suppliers?: Record<string, unknown>[] };
    // Build real search URLs server-side from the keyword the AI provides
    if (Array.isArray(data.suppliers)) {
      for (const s of data.suppliers) {
        const keyword = (s.searchKeyword as string) || (productName as string);
        s.url = buildSupplierUrl(s.platform as string, keyword);
      }
    }
    res.json(data);
  } catch {
    req.log.error({ text }, "Failed to parse AI supplier response");
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

// ─── Generate Content ─────────────────────────────────────────────────────────

router.post("/ai/generate-content", async (req, res) => {
  const parsed = AiGenerateContentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { productName, productDescription, contentType, targetAudience, tone = "trendy" } = parsed.data;
  const audienceClause = targetAudience ? ` Target: ${targetAudience}.` : "";

  const typeInstructions: Record<string, string> = {
    caption: "a TikTok caption (max 150 chars, punchy, curiosity-driving, ends with CTA like 'Link in bio' or 'Shop now')",
    script: `a TikTok video script (15–30 seconds).
- HOOK (0–3s): Scroll-stopping opening line — make someone pause mid-scroll
- PROBLEM (3–10s): Agitate the pain or desire — make it relatable
- SOLUTION (10–20s): Introduce the product naturally, show the transformation
- CTA (20–30s): Urgent call to action with reason to act NOW
Format exactly as: HOOK: ... | PROBLEM: ... | SOLUTION: ... | CTA: ...`,
    hooks: `5 different scroll-stopping hook lines for a TikTok video.
Each hook must work in the first 3 seconds. Use proven formats:
- POV: you just found...
- "I spent $X and made $Y this week"
- Numbers: "3 reasons why this is selling out"
- Controversy: "Everyone is getting this wrong"
- Pattern interrupt: unexpected statement or question`,
    full_campaign: `a complete TikTok campaign package with:
1. 3 hook line variants (different angles)
2. Full 30-second video script (HOOK | PROBLEM | SOLUTION | CTA format)
3. Caption with emoji and CTA (under 150 chars)
4. 5 very specific posting tips for this exact product`,
  };

  const response = await aiChat([
    {
      role: "system",
      content: `You are a viral TikTok content creator who consistently hits 1M+ views and drives real purchases. You know the psychology of scroll-stopping content: the first 3 seconds determine everything. Tone: ${tone}. Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `Create ${typeInstructions[contentType] ?? "TikTok marketing content"} for:
Product: ${productName}
Description: ${productDescription}${audienceClause}

Return ONLY this JSON:
{
  "content": "The main content — complete and ready to use, no placeholders",
  "hashtags": "#TikTokShop #viral #tiktokmademebuyit #[niche specific] #[product specific]",
  "tips": "3 specific execution tips to maximize views and conversions for THIS exact product"
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
      content: `You are a TikTok Shop listing specialist with an 8% average conversion rate. You write listings that rank in search, convert browsers into buyers, and make people feel they'd be foolish NOT to buy. Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `Write a high-converting TikTok Shop listing for:
Product: ${productName}
Description: ${productDescription}${targetAudience ? ` Target: ${targetAudience}.` : ""}${keyFeatures ? ` Features: ${keyFeatures}.` : ""}

Return ONLY this JSON:
{
  "title": "SEO-optimized title under 80 chars — lead with the most searched keyword",
  "description": "3 paragraphs: 1) Hook that identifies the problem the buyer has, 2) How this product solves it with specific features, 3) Social proof angle + urgency to buy now",
  "bulletPoints": ["Benefit-led point 1 with specific detail", "Point 2", "Point 3", "Point 4", "Point 5"],
  "hashtags": "#TikTokShop #hashtag2 #hashtag3 #hashtag4 #hashtag5",
  "callToAction": "Specific, urgent CTA that drives immediate action"
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
      content: `You are a TikTok Shop trend analyst who monitors viral content daily. You know exactly what niches are exploding, which are saturated, and where the money is right now. Be brutally specific — no generic answers. Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `List 8 trending niches for TikTok dropshipping right now (based on current virality, seasonality, and buyer psychology).

Mix proven evergreen niches + emerging high-opportunity niches. For each, explain WHY NOW specifically.

Return ONLY this JSON:
{
  "niches": [
    {
      "name": "Niche name",
      "emoji": "🔥",
      "description": "One-sentence description of the specific opportunity",
      "opportunityScore": 88,
      "competitionLevel": "low",
      "avgProfitMargin": 72,
      "whyNow": "Exactly why this niche is hot RIGHT NOW — specific trend, season, viral moment, or cultural shift",
      "exampleProducts": ["Specific viral product 1", "Specific product 2", "Specific product 3"]
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

  const priceContext = estimatedCost
    ? ` Sourcing cost: $${estimatedCost}. Target sell price: $${estimatedSellingPrice ?? "TBD"}.`
    : "";

  const response = await aiChat([
    {
      role: "system",
      content: `You are a TikTok Shop business consultant who has helped 100+ sellers scale to $10K+/month. You give brutally honest, data-driven verdicts — you do NOT sugarcoat. A BUY verdict must have clear evidence. A PASS means real red flags exist. RISKY means proceed with caution for specific reasons. Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `Analyze this product and give me an honest verdict:
Product: ${productName}
Description: ${productDescription}${priceContext}

Return ONLY this JSON:
{
  "verdict": "BUY / PASS / RISKY",
  "verdictReason": "2-3 honest sentences explaining exactly why — cite specific reasons like competition, saturation, profit margin, TikTok virality potential",
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
    "psychologicalPricePoint": "Why this price converts better than round numbers",
    "bundleIdea": "Specific bundle to increase average order value"
  },
  "launchPlan": [
    { "week": 1, "focus": "Content testing", "actions": ["Specific action 1", "Action 2", "Action 3"] },
    { "week": 2, "focus": "Scale winners", "actions": ["Action 1", "Action 2"] },
    { "week": 3, "focus": "Optimize & automate", "actions": ["Action 1", "Action 2"] }
  ],
  "contentAngles": [
    { "angle": "Angle name", "hook": "Exact first line to say on camera", "format": "Specific video format (length, style)" },
    { "angle": "Angle 2", "hook": "Hook line 2", "format": "Format 2" },
    { "angle": "Angle 3", "hook": "Hook line 3", "format": "Format 3" }
  ],
  "risks": ["Specific risk 1", "Specific risk 2"],
  "competitorWeaknesses": "What current sellers are doing wrong that you can exploit immediately",
  "winningStrategy": "The single most important move to succeed with this specific product"
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
      content: `You are an AI dropshipping autopilot. In one shot, you generate everything a TikTok seller needs to launch immediately: supplier sourcing keywords and ready-to-post content. Be hyper-specific and actionable. Never make up URLs. Provide real search keywords instead. Always respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `Generate a complete launch package for:
Product: ${productName}
Description: ${productDescription}${targetAudience ? ` Target audience: ${targetAudience}.` : ""}

For suppliers: provide REAL search keywords (not URLs) that will find this exact product on each platform.
For content: write complete, ready-to-post text — no placeholders, no "[product name]" substitutions.

Return ONLY this JSON:
{
  "suppliers": [
    {
      "name": "CJDropshipping",
      "platform": "CJDropshipping",
      "searchKeyword": "exact keyword to search on CJDropshipping",
      "shippingTime": "7–12 days to US",
      "rating": 4.8,
      "minOrderQuantity": 1,
      "notes": "Best for TikTok Shop — fast US shipping, supports product branding, no minimum"
    },
    {
      "name": "AliExpress",
      "platform": "AliExpress",
      "searchKeyword": "exact keyword to search on AliExpress",
      "shippingTime": "10–18 days to US",
      "rating": 4.6,
      "minOrderQuantity": 1,
      "notes": "Widest selection and price comparison — good for testing before scaling"
    },
    {
      "name": "Alibaba",
      "platform": "Alibaba",
      "searchKeyword": "exact keyword to search on Alibaba",
      "shippingTime": "15–25 days to US",
      "rating": 4.5,
      "minOrderQuantity": 10,
      "notes": "Best unit cost when scaling — negotiate private labeling for brand differentiation"
    }
  ],
  "contentPieces": [
    {
      "title": "Viral Caption",
      "contentType": "caption",
      "content": "Complete ready-to-post caption with emoji, under 150 chars, ends with CTA",
      "hashtags": "#TikTokShop #tiktokmademebuyit #[relevant niche hashtag] #[product hashtag]",
      "hook": "The exact opening line that stops scrolling"
    },
    {
      "title": "30-Second Video Script",
      "contentType": "script",
      "content": "HOOK (0-3s): [exact line] | PROBLEM (3-10s): [exact script] | SOLUTION (10-20s): [exact script showing product] | CTA (20-30s): [exact closing line]",
      "hashtags": "#TikTokShop #viral #[niche]",
      "hook": "The exact first line to say on camera"
    },
    {
      "title": "5 Hook Lines Pack",
      "contentType": "hooks",
      "content": "1. [Exact hook line]\\n2. [Exact hook line]\\n3. [Exact hook line]\\n4. [Exact hook line]\\n5. [Exact hook line]",
      "hashtags": "#TikTokShop #viral",
      "hook": "The strongest hook from the 5"
    }
  ],
  "launchChecklist": [
    "Search '[keyword]' on CJDropshipping and order 3-5 samples TODAY",
    "Film unboxing the moment samples arrive — raw authentic content converts best",
    "Post Hook Line #1 first to test engagement before full script",
    "Reply to EVERY comment within the first 2 hours — TikTok algorithm rewards this",
    "Set price at psychological anchor ($X.99 not $X+1) to maximize conversion"
  ]
}`,
    },
  ], 6000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try {
    const data = parseJson(text) as { suppliers?: Record<string, unknown>[] };
    // Build real search URLs from the keywords the AI provides
    if (Array.isArray(data.suppliers)) {
      for (const s of data.suppliers) {
        const keyword = (s.searchKeyword as string) || (productName as string);
        s.url = buildSupplierUrl(s.platform as string, keyword);
      }
    }
    res.json(data);
  } catch {
    req.log.error({ text }, "Failed to parse autopilot response");
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

// ─── Discover — zero-input trending products ──────────────────────────────────

router.post("/ai/discover", async (req, res) => {
  const response = await aiChat([
    {
      role: "system",
      content: `You are a TikTok Shop expert who monitors viral trends daily and has helped 500+ sellers find winning products. You know exactly what is selling on TikTok RIGHT NOW. You respond only with valid JSON.`,
    },
    {
      role: "user",
      content: `What 5 products should someone sell on TikTok Shop RIGHT NOW to make money within 30 days?

Requirements:
- Actively going viral or trending on TikTok (verifiable by hashtag volume or "For You" page presence)
- Can be sourced from AliExpress or CJDropshipping for under $15
- At least 65% profit margin
- Easy to film — strong visual reaction, wow moment, or satisfying demo
- Specific product names, not generic categories
- Include the exact AliExpress/CJDropshipping search keyword

Return ONLY this JSON:
{
  "marketContext": "2 sentences on what's driving TikTok Shop sales right now and why",
  "products": [
    {
      "name": "Very specific product name",
      "emoji": "🔥",
      "category": "Category",
      "description": "Why this product is blowing up — specific viral trigger",
      "whyNow": "Exact reason this is the moment — trend, season, viral hashtag, or cultural moment",
      "estimatedCost": 7.50,
      "estimatedSellingPrice": 29.99,
      "profitMargin": 75,
      "trendScore": 92,
      "viralAngle": "The single best TikTok video concept — what exactly to show on camera",
      "firstHook": "The exact first line to say in your first video",
      "sourcingKeyword": "Exact search term on AliExpress or CJDropshipping",
      "imageSearchQuery": "2-4 word product photo keyword"
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
        const keyword = (p.sourcingKeyword as string) || (p.name as string) || "";
        p.aliexpressUrl = buildSupplierUrl("aliexpress", keyword);
        p.cjUrl = buildSupplierUrl("cjdropshipping", keyword);
      }
    }
    res.json(data);
  } catch {
    req.log.error({ text }, "Failed to parse discover response");
    res.status(500).json({ error: "Failed to parse AI response" });
  }
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

Be hyper-specific. Every action should be something the seller can do today. Give real numbers and real tactics.

Return ONLY this JSON:
{
  "summary": "2-sentence executive summary with specific revenue target and timeframe",
  "targetAudience": {
    "primary": "Most specific possible description: age, income, specific pain point",
    "secondary": "Secondary audience",
    "psychographics": "What emotional trigger drives them to buy (not 'they want it' — WHY do they impulse buy)",
    "bestTimeToReach": "Specific time windows when this audience is most active on TikTok"
  },
  "contentStrategy": {
    "postingFrequency": "X posts per day — with specific timing",
    "contentMix": {
      "hooks": "40% — scroll-stopping problem/solution openers",
      "demos": "30% — showing the product in action with reactions",
      "testimonials": "20% — UGC-style authentic reviews",
      "trending": "10% — riding trending sounds and formats"
    },
    "bestFormats": ["Format 1 — specific reason it converts", "Format 2", "Format 3"],
    "videoLength": "Optimal length with specific reason based on this product type",
    "bestPostingTimes": ["7-9am local", "12-2pm", "7-10pm"]
  },
  "weeklyPlan": [
    { "week": 1, "theme": "Launch & Test", "goal": "Find winning hook", "dailyActions": ["Specific daily action 1", "Action 2", "Action 3"], "successMetric": "Specific KPI to hit" },
    { "week": 2, "theme": "Double Down", "goal": "Scale winners", "dailyActions": ["Action 1", "Action 2"], "successMetric": "Specific KPI" },
    { "week": 3, "theme": "Community & UGC", "goal": "Social proof", "dailyActions": ["Action 1", "Action 2"], "successMetric": "Specific KPI" },
    { "week": 4, "theme": "Paid Amplification", "goal": "Scale with ads", "dailyActions": ["Action 1", "Action 2"], "successMetric": "Specific revenue target" }
  ],
  "tiktokTactics": [
    "Very specific tactic 1 with exact how-to",
    "Specific tactic 2",
    "Specific tactic 3",
    "Specific tactic 4",
    "Specific tactic 5"
  ],
  "hashtagStrategy": {
    "niche": ["#niche1", "#niche2", "#niche3"],
    "broad": ["#TikTokShop", "#tiktokmademebuyit", "#viral"],
    "trending": "Check TikTok Creative Center weekly for trending hashtags in your niche",
    "tip": "Use 3-5 niche + 2-3 broad hashtags — never more than 8 total"
  },
  "budgetAllocation": {
    "organic": "First 2 weeks: $0 — build organic proof of concept first",
    "tiktokSpark": "Week 3: $5-10/day Spark Ads on your best organic video",
    "tiktokAds": "Week 4+: $20-50/day once you have a proven creative with >50% watch rate",
    "ugcCreators": "Optional: $50-200 for micro-influencer posts in your niche"
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
      content: `You are a TikTok content strategist who creates viral posting calendars for dropshippers. Every post in your calendar has a distinct angle, format, and hook — nothing repetitive. Each post is immediately actionable. You respond only with valid JSON.`,
    },
    {
      role: "user",
      content: `Create a 7-day TikTok content calendar for:
Product: ${productName}
Description: ${productDescription}
Posts per day: ${postsPerDay}

Make each post completely different. Alternate between hooks, demos, testimonials, and trending formats. Include exact camera-ready hooks and specific timing.

Return ONLY this JSON:
{
  "weekSummary": "What this week accomplishes and why this sequence builds momentum",
  "days": [
    {
      "day": 1,
      "theme": "Day theme",
      "posts": [
        {
          "time": "7:30am",
          "contentType": "hook video",
          "hook": "EXACT first line to say — camera-ready, no placeholders",
          "topic": "Specific topic and what to show in the video",
          "script": "30-word outline: exactly what to say and show",
          "hashtags": "#TikTokShop #hashtag2 #hashtag3 #hashtag4",
          "expectedOutcome": "What this post should achieve (views, profile visits, sales)"
        }
      ]
    }
  ],
  "proTips": [
    "Specific tip 1 unique to this product's content strategy",
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

// ─── Full Launch ──────────────────────────────────────────────────────────────

router.post("/ai/full-launch", async (req, res) => {
  const response = await aiChat([
    {
      role: "system",
      content: `You are a veteran TikTok Shop dropshipping expert with $10M+ in student revenue. You give brutally specific, real information:
- Actual product names that exist on AliExpress, CJDropshipping, or Alibaba
- Psychologically optimized prices ($29.99, $34.99, $44.99 — never round numbers)
- Hook lines that ACTUALLY stop scrolling in the first 3 seconds
- Real search keywords for suppliers (never made-up store URLs)
- Descriptions that trigger impulse buying

You respond only with valid JSON — no markdown, no commentary.`,
    },
    {
      role: "user",
      content: `Find 4 trending products I can start selling on TikTok Shop TODAY with everything I need to launch immediately.

Requirements:
- Currently trending or viral on TikTok (think: #tiktokmademebuyit, TikTok Shop bestsellers)
- Source for under $12, sell for $20–$55
- At least 65% profit margin potential
- Easy to create TikTok content — strong visual wow factor, emotional reaction, or satisfying demo
- Mix of different niches (beauty, home, tech, lifestyle, kitchen, etc.)
- Products that actually exist on AliExpress or CJDropshipping right now

Return ONLY this JSON — all fields required:
{
  "products": [
    {
      "name": "Very specific product name (e.g. 'Magnetic Levitating Moon Lamp' not 'lamp')",
      "emoji": "🔥",
      "category": "Exact category",
      "shortDescription": "One punchy sentence creating immediate desire",
      "fullDescription": "3 sentences: what it is + what makes it special + who it's for. Conversion-focused, no fluff.",
      "sellingPoints": [
        "Specific benefit 1 with emotional hook",
        "Specific benefit 2",
        "Specific benefit 3",
        "Fast shipping / fulfillment advantage",
        "TikTok viral trigger (what makes people share it)"
      ],
      "sourcingPrice": 8.50,
      "tiktokShopPrice": 34.99,
      "flashSalePrice": 27.99,
      "competitorAmazonPrice": 49.99,
      "profitPerUnit": 26.49,
      "profitMargin": 76,
      "trendScore": 91,
      "monthlyRevenue": "$4,200/mo at 5 units/day",
      "imageSearchQuery": "2-4 word product photo search (e.g. 'magnetic moon lamp')",
      "aliexpressSearchKeyword": "exact keyword to search on AliExpress",
      "cjSearchKeyword": "exact keyword to search on CJDropshipping",
      "alibabaSearchKeyword": "exact keyword to search on Alibaba",
      "targetAudience": "Specific demographic: age range, interest, pain point",
      "hooks": [
        "I spent $9 and made $600 this week — here's exactly what I sold",
        "POV: you finally found a winning TikTok Shop product",
        "This thing sells itself — I literally just film the unboxing",
        "Why is everyone ordering this? (honest review)",
        "The $9 product I sell for $35 that keeps selling out"
      ],
      "videoScript": "HOOK (0-3s): [exact line + action] | DEMO (3-15s): [step by step what to show] | REVEAL (15-20s): [the wow moment] | CTA (20-25s): [exact words to drive clicks]",
      "hashtags": "#TikTokShop #tiktokmademebuyit #viral #[niche hashtag] #[product hashtag]",
      "suppliers": [
        {
          "name": "CJDropshipping",
          "platform": "CJDropshipping",
          "searchKeyword": "exact search keyword for CJDropshipping",
          "shippingTime": "8-12 days to US",
          "rating": 4.8,
          "minOrderQuantity": 1,
          "notes": "Best for TikTok Shop — fast US shipping, supports branding"
        },
        {
          "name": "AliExpress",
          "platform": "AliExpress",
          "searchKeyword": "exact search keyword for AliExpress",
          "shippingTime": "10-18 days to US",
          "rating": 4.6,
          "minOrderQuantity": 1,
          "notes": "Widest selection for price comparison before committing"
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
        // Build real search URLs from the keywords the AI provides
        const aliKw = (p.aliexpressSearchKeyword as string) || (p.name as string) || "";
        const cjKw = (p.cjSearchKeyword as string) || (p.name as string) || "";
        const alibabaKw = (p.alibabaSearchKeyword as string) || (p.name as string) || "";
        p.aliexpressSearchUrl = buildSupplierUrl("aliexpress", aliKw);
        p.cjSearchUrl = buildSupplierUrl("cjdropshipping", cjKw);
        p.alibabaUrl = buildSupplierUrl("alibaba", alibabaKw);
        // Build supplier URLs within the suppliers array too
        if (Array.isArray(p.suppliers)) {
          for (const s of p.suppliers as Record<string, unknown>[]) {
            const kw = (s.searchKeyword as string) || (p.name as string) || "";
            s.url = buildSupplierUrl(s.platform as string, kw);
          }
        }
        // Attach product image
        const q = (p.imageSearchQuery as string) || (p.name as string) || "product";
        p.imageUrl = getProductImageUrl(q);
      }
    }
    res.json(data);
  } catch {
    req.log.error({ text }, "Failed to parse full-launch response");
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

// ─── Ask AI ───────────────────────────────────────────────────────────────────

router.post("/ai/ask", async (req, res) => {
  const { message } = req.body as { message: string };
  if (!message?.trim()) { res.status(400).json({ error: "message is required" }); return; }

  const response = await aiChat([
    {
      role: "system",
      content: `You are a TikTok Shop dropshipping expert with 7+ years making $200K+/year. You know:
- Finding and validating winning products fast
- TikTok algorithm, viral content, and what actually converts
- Supplier sourcing: AliExpress, CJDropshipping, Zendrop, Alibaba
- Pricing strategy and profit maximization
- Scaling from side hustle to $10K+/month
- Customer service, returns, and operations
- TikTok ads, Spark Ads, and paid amplification
- Competitor analysis and market research

Give specific, actionable advice with real numbers and real examples. No generic tips. End with 2-3 actions the person can do TODAY. Respond with valid JSON only.`,
    },
    {
      role: "user",
      content: `${message}

Return ONLY this JSON:
{
  "answer": "Your complete, specific answer with real examples and real numbers",
  "actionItems": ["Do THIS today: specific action 1", "Specific action 2", "Specific action 3"],
  "followUpQuestions": ["Useful follow-up question 1?", "Follow-up 2?", "Follow-up 3?"]
}`,
    },
  ], 4000);

  const text = response.choices[0]?.message?.content ?? "{}";
  try { res.json(parseJson(text)); }
  catch { req.log.error({ text }, "Failed to parse ask response"); res.status(500).json({ error: "Failed to parse AI response" }); }
});

export default router;
