import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Only manage this app's tables — ignore any other tables in the shared DB
  tablesFilter: [
    "products",
    "suppliers",
    "campaigns",
    "conversations",
    "messages",
    "shop_settings",
  ],
});
