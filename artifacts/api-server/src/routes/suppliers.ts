import { Router } from "express";
import { db, suppliersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateSupplierBody,
  GetSupplierParams,
  DeleteSupplierParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/suppliers", async (req, res) => {
  const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.createdAt);
  res.json(suppliers);
});

router.post("/suppliers", async (req, res) => {
  const parsed = CreateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { rating, minOrderQuantity, ...rest } = parsed.data;
  const [supplier] = await db.insert(suppliersTable).values({
    ...rest,
    rating: rating != null ? String(rating) : null,
    minOrderQuantity: minOrderQuantity ?? null,
  }).returning();
  res.status(201).json(supplier);
});

router.get("/suppliers/:id", async (req, res) => {
  const parsed = GetSupplierParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, parsed.data.id));
  if (!supplier) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }
  res.json(supplier);
});

router.delete("/suppliers/:id", async (req, res) => {
  const parsed = DeleteSupplierParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(suppliersTable).where(eq(suppliersTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
