import { Router } from "express";
import { db, campaignsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateCampaignBody,
  UpdateCampaignBody,
  UpdateCampaignParams,
  GetCampaignParams,
  DeleteCampaignParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/campaigns", async (req, res) => {
  const campaigns = await db.select().from(campaignsTable).orderBy(campaignsTable.createdAt);
  res.json(campaigns);
});

router.post("/campaigns", async (req, res) => {
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [campaign] = await db.insert(campaignsTable).values(parsed.data).returning();
  res.status(201).json(campaign);
});

router.get("/campaigns/:id", async (req, res) => {
  const parsed = GetCampaignParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, parsed.data.id));
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(campaign);
});

router.patch("/campaigns/:id", async (req, res) => {
  const paramsParsed = UpdateCampaignParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db.update(campaignsTable).set(parsed.data).where(eq(campaignsTable.id, paramsParsed.data.id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(updated);
});

router.delete("/campaigns/:id", async (req, res) => {
  const parsed = DeleteCampaignParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(campaignsTable).where(eq(campaignsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
