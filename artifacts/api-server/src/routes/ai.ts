import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  AiResearchProductsBody,
  AiFindSuppliersBody,
  AiGenerateContentBody,
  AiGenerateListingBody,
} from "@workspace/api-zod";

const router = Router();

router.post("/ai/research-products", async (req, res) => {
  const parsed = AiResearchProductsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { niche, budget, count = 5 } = parsed.data;
  const budgetText = budget ? ` with a sourcing budget of around $${budget} per unit` : "";
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are a TikTok Shop dropshipping expert. Generate trending product ideas that sell well on TikTok. Always respond with valid JSON only.`,
      },
      {
        role: "user",
        content: `Generate ${count} trending product ideas for the "${niche}" niche${budgetText} that would be great for TikTok Shop dropshipping.

Respond with this exact JSON structure:
{
  "ideas": [
    {
      "name": "Product name",
      "description": "Short compelling description",
      "category": "Category",
      "estimatedCost": 5.99,
      "estimatedSellingPrice": 19.99,
      "profitMargin": 70,
      "trendScore": 85,
      "whyItWorks": "Why this product trends on TikTok",
      "targetAudience": "Who buys this"
    }
  ]
}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed_result = JSON.parse(content);
    res.json(parsed_result);
  } catch {
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

router.post("/ai/find-suppliers", async (req, res) => {
  const parsed = AiFindSuppliersBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { productName, productCategory, count = 5 } = parsed.data;
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are a dropshipping supplier expert. Recommend real supplier platforms and strategies. Always respond with valid JSON only.`,
      },
      {
        role: "user",
        content: `Find ${count} supplier recommendations for "${productName}" in the "${productCategory}" category for a TikTok Shop dropshipper.

Respond with this exact JSON structure:
{
  "suppliers": [
    {
      "name": "Supplier or store name",
      "platform": "AliExpress/CJDropshipping/Alibaba/Temu/etc",
      "url": "https://example.com/search-url",
      "productCategory": "${productCategory}",
      "rating": 4.7,
      "minOrderQuantity": 1,
      "shippingTime": "7-14 days",
      "notes": "Key notes about this supplier",
      "whyRecommended": "Why this supplier is great for TikTok dropshipping"
    }
  ]
}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed_result = JSON.parse(content);
    res.json(parsed_result);
  } catch {
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

router.post("/ai/generate-content", async (req, res) => {
  const parsed = AiGenerateContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { productName, productDescription, contentType, targetAudience, tone = "trendy" } = parsed.data;
  const audienceText = targetAudience ? ` Target audience: ${targetAudience}.` : "";

  const contentTypeInstructions: Record<string, string> = {
    caption: "a TikTok caption (under 150 characters, punchy and engaging)",
    script: "a TikTok video script (15-30 seconds, with hooks and CTA)",
    hooks: "5 different TikTok video hook lines (first 3 seconds that stop the scroll)",
    full_campaign: "a full TikTok campaign: hook line, video script, caption, and posting tips",
  };

  const instruction = contentTypeInstructions[contentType] ?? "TikTok marketing content";

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 2048,
    messages: [
      {
        role: "system",
        content: `You are a viral TikTok marketing expert who creates content that gets millions of views. Always respond with valid JSON only.`,
      },
      {
        role: "user",
        content: `Create ${instruction} for this product:
Product: ${productName}
Description: ${productDescription}
Tone: ${tone}${audienceText}

Respond with this exact JSON structure:
{
  "content": "The main content here",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5",
  "tips": "1-2 tips for making this content perform better on TikTok"
}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed_result = JSON.parse(content);
    res.json(parsed_result);
  } catch {
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

router.post("/ai/generate-listing", async (req, res) => {
  const parsed = AiGenerateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { productName, productDescription, targetAudience, keyFeatures } = parsed.data;
  const audienceText = targetAudience ? ` Target audience: ${targetAudience}.` : "";
  const featuresText = keyFeatures ? ` Key features: ${keyFeatures}.` : "";

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 2048,
    messages: [
      {
        role: "system",
        content: `You are a TikTok Shop listing expert who creates compelling product listings that convert. Always respond with valid JSON only.`,
      },
      {
        role: "user",
        content: `Create a complete TikTok Shop product listing for:
Product: ${productName}
Description: ${productDescription}${audienceText}${featuresText}

Respond with this exact JSON structure:
{
  "title": "Optimized product title (under 80 chars)",
  "description": "Compelling product description (2-3 paragraphs)",
  "bulletPoints": ["Key benefit 1", "Key benefit 2", "Key benefit 3", "Key benefit 4", "Key benefit 5"],
  "hashtags": "#TikTokShop #hashtag2 #hashtag3 #hashtag4 #hashtag5",
  "callToAction": "Compelling CTA text"
}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed_result = JSON.parse(content);
    res.json(parsed_result);
  } catch {
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

export default router;
