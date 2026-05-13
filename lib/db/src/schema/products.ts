import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 2 }),
  estimatedSellingPrice: numeric("estimated_selling_price", { precision: 10, scale: 2 }),
  profitMargin: numeric("profit_margin", { precision: 5, scale: 2 }),
  trendScore: integer("trend_score"),
  status: text("status", { enum: ["researching", "active", "paused", "archived"] }).notNull().default("researching"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
