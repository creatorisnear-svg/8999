import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { shopSettings } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

async function getOrCreateSettings() {
  const [existing] = await db.select().from(shopSettings).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(shopSettings).values({}).returning();
  return created;
}

router.get("/settings/shop", async (req: Request, res: Response) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch shop settings");
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/settings/shop", async (req: Request, res: Response) => {
  try {
    const { shopName, shopUrl, sellerId, region, accessToken } = req.body as {
      shopName?: string;
      shopUrl?: string;
      sellerId?: string;
      region?: string;
      accessToken?: string;
    };

    const isConnected = !!(shopName && accessToken);
    const existing = await getOrCreateSettings();

    const [updated] = await db
      .update(shopSettings)
      .set({
        shopName: shopName ?? null,
        shopUrl: shopUrl ?? null,
        sellerId: sellerId ?? null,
        region: region ?? null,
        accessToken: accessToken ?? null,
        isConnected,
        updatedAt: new Date(),
      })
      .where(eq(shopSettings.id, existing.id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update shop settings");
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
