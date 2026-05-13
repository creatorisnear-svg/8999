import { Router } from "express";
import { db, productsTable, suppliersTable, campaignsTable } from "@workspace/db";
import { count, avg, eq } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  const [productStats] = await db.select({ total: count() }).from(productsTable);
  const [activeProducts] = await db.select({ total: count() }).from(productsTable).where(eq(productsTable.status, "active"));
  const [supplierStats] = await db.select({ total: count() }).from(suppliersTable);
  const [campaignStats] = await db.select({ total: count() }).from(campaignsTable);
  const [readyCampaigns] = await db.select({ total: count() }).from(campaignsTable).where(eq(campaignsTable.status, "ready"));
  const [postedCampaigns] = await db.select({ total: count() }).from(campaignsTable).where(eq(campaignsTable.status, "posted"));
  const [marginStats] = await db.select({ avg: avg(productsTable.profitMargin) }).from(productsTable);

  res.json({
    totalProducts: productStats?.total ?? 0,
    activeProducts: activeProducts?.total ?? 0,
    totalSuppliers: supplierStats?.total ?? 0,
    totalCampaigns: campaignStats?.total ?? 0,
    readyCampaigns: readyCampaigns?.total ?? 0,
    postedCampaigns: postedCampaigns?.total ?? 0,
    avgProfitMargin: marginStats?.avg != null ? parseFloat(String(marginStats.avg)) : null,
  });
});

export default router;
