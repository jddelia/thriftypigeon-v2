import { eq } from "drizzle-orm";

import { getDb } from "./drizzle";
import { orders } from "./schema";

export type OrderRecord = typeof orders.$inferSelect;

export interface UpsertOrderInput {
  orderId: string;
  email: string;
  variantId: string;
  playbookSlug: string;
  status: string;
  total: string;
  downloadKey?: string | null;
  currency?: string | null;
}

export async function findOrderByOrderId(orderId: string): Promise<OrderRecord | null> {
  const db = getDb();

  if (!db) {
    console.warn("Database is not configured. Unable to lookup order.");
    return null;
  }

  const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId)).limit(1);
  return order ?? null;
}

export async function upsertOrder(input: UpsertOrderInput): Promise<OrderRecord | null> {
  const db = getDb();

  if (!db) {
    console.warn("Database is not configured. Skipping order persistence.");
    return null;
  }

  const existing = await findOrderByOrderId(input.orderId);
  const values = {
    orderId: input.orderId,
    email: input.email,
    variantId: input.variantId,
    playbookSlug: input.playbookSlug,
    status: input.status,
    total: input.total,
    currency: input.currency ?? existing?.currency ?? null,
    downloadKey: input.downloadKey ?? existing?.downloadKey ?? null,
    updatedAt: new Date(),
  } satisfies Partial<OrderRecord> & { orderId: string };

  if (!existing) {
    const [inserted] = await db
      .insert(orders)
      .values({
        ...values,
        createdAt: new Date(),
      })
      .returning();

    return inserted ?? null;
  }

  const [updated] = await db.update(orders).set(values).where(eq(orders.id, existing.id)).returning();
  return updated ?? existing;
}

export async function markOrderFulfilled(orderId: string, downloadKey?: string | null) {
  const db = getDb();

  if (!db) {
    console.warn("Database is not configured. Cannot mark fulfillment.");
    return;
  }

  await db
    .update(orders)
    .set({
      fulfillmentSentAt: new Date(),
      updatedAt: new Date(),
      ...(downloadKey ? { downloadKey } : {}),
    })
    .where(eq(orders.orderId, orderId));
}
