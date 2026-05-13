import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  DeleteProductParams,
  GetProductParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/products", async (req, res) => {
  const products = await db.select().from(productsTable).orderBy(productsTable.createdAt);
  res.json(products);
});

router.post("/products", async (req, res) => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { estimatedCost, estimatedSellingPrice, trendScore, ...rest } = parsed.data;
  let profitMargin: string | null = null;
  if (estimatedCost != null && estimatedSellingPrice != null && estimatedCost > 0) {
    profitMargin = (((estimatedSellingPrice - estimatedCost) / estimatedSellingPrice) * 100).toFixed(2);
  }
  const [product] = await db.insert(productsTable).values({
    ...rest,
    estimatedCost: estimatedCost != null ? String(estimatedCost) : null,
    estimatedSellingPrice: estimatedSellingPrice != null ? String(estimatedSellingPrice) : null,
    profitMargin,
    trendScore: trendScore ?? null,
  }).returning();
  res.status(201).json(product);
});

router.get("/products/:id", async (req, res) => {
  const parsed = GetProductParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, parsed.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
});

router.patch("/products/:id", async (req, res) => {
  const paramsParsed = UpdateProductParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { estimatedCost, estimatedSellingPrice, trendScore, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost != null ? String(estimatedCost) : null;
  if (estimatedSellingPrice !== undefined) updateData.estimatedSellingPrice = estimatedSellingPrice != null ? String(estimatedSellingPrice) : null;
  if (trendScore !== undefined) updateData.trendScore = trendScore;
  if (estimatedCost != null && estimatedSellingPrice != null && estimatedCost > 0) {
    updateData.profitMargin = (((estimatedSellingPrice - estimatedCost) / estimatedSellingPrice) * 100).toFixed(2);
  }
  const [updated] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, paramsParsed.data.id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(updated);
});

router.delete("/products/:id", async (req, res) => {
  const parsed = DeleteProductParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(productsTable).where(eq(productsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
