import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  email: text("email").notNull(),
  providerId: text("provider_id").notNull(),
  playbookSlug: text("playbook_slug").notNull(),
  status: text("status").notNull(),
  total: text("total").notNull(),
  currency: text("currency"),
  downloadKey: text("download_key"),
  fulfillmentSentAt: timestamp("fulfillment_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  status: text("status").notNull(),
  source: text("source").notNull().default("website"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
