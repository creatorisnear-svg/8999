import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  productId: integer("product_id"),
  title: text("title").notNull(),
  contentType: text("content_type", { enum: ["caption", "script", "hooks", "listing", "full_campaign"] }).notNull(),
  content: text("content").notNull(),
  hashtags: text("hashtags"),
  targetAudience: text("target_audience"),
  status: text("status", { enum: ["draft", "ready", "posted"] }).notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
