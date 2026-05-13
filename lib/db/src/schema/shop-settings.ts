import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const shopSettings = pgTable("shop_settings", {
  id: serial("id").primaryKey(),
  shopName: text("shop_name"),
  shopUrl: text("shop_url"),
  sellerId: text("seller_id"),
  region: text("region"),
  accessToken: text("access_token"),
  isConnected: boolean("is_connected").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ShopSettings = typeof shopSettings.$inferSelect;
export type InsertShopSettings = typeof shopSettings.$inferInsert;
