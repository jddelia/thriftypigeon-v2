import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getLemonSqueezyWebhookSecret } from "@/lib/commerce/lemonsqueezy";
import { findOrderByOrderId, markOrderFulfilled, upsertOrder } from "@/lib/db/orders";
import { sendEmail } from "@/lib/email";
import { getPlaybook } from "@/lib/sanity/queries";

const SIGNATURE_HEADER = "x-signature";

export const dynamic = "force-dynamic";

function verifySignature(payload: string, signature: string | null, secret: string | undefined) {
  if (!secret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const computed = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const receivedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(computed, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

const webhookSchema = z.object({
  meta: z
    .object({
      event_name: z.string(),
      custom_data: z.record(z.string(), z.unknown()).optional(),
    })
    .passthrough(),
  data: z.object({
    id: z.union([z.string(), z.number()]).transform((value) => value.toString()),
    attributes: z
      .object({
        status: z.string(),
        email: z.string().email(),
        currency: z.string().optional(),
        formatted_total: z.string().optional(),
        total_formatted: z.string().optional(),
        total: z.union([z.number(), z.string()]).optional(),
        variant_id: z.union([z.string(), z.number()]).optional(),
        custom_data: z.record(z.string(), z.unknown()).optional(),
        checkout_data: z
          .object({
            custom: z.record(z.string(), z.unknown()).optional(),
          })
          .partial()
          .optional(),
      })
      .passthrough(),
    relationships: z
      .object({
        variant: z
          .object({
            data: z
              .object({
                id: z.union([z.string(), z.number()]).transform((value) => value.toString()),
              })
              .optional(),
          })
          .optional(),
      })
      .partial()
      .optional(),
  }),
});

interface NormalizedOrderPayload {
  eventName: string;
  orderId: string;
  email: string;
  variantId: string;
  status: string;
  total: string;
  currency?: string;
  playbookSlug?: string;
}

function normalizeOrderPayload(payload: z.infer<typeof webhookSchema>): NormalizedOrderPayload {
  const eventName = payload.meta.event_name;
  const orderId = payload.data.id;
  const attributes = payload.data.attributes;
  const variantRelationship = payload.data.relationships?.variant?.data?.id;
  const variantId = attributes.variant_id
    ? attributes.variant_id.toString()
    : (variantRelationship ?? "");

  if (!variantId) {
    throw new Error("Missing variant identifier");
  }

  const status = attributes.status.toLowerCase();
  const currency = attributes.currency?.toUpperCase();
  const total =
    attributes.formatted_total ??
    attributes.total_formatted ??
    (attributes.total !== undefined ? attributes.total.toString() : "");

  const customData = {
    ...(attributes.checkout_data?.custom ?? {}),
    ...(attributes.custom_data ?? {}),
    ...(payload.meta.custom_data ?? {}),
  } as Record<string, unknown>;

  const slugValue =
    typeof customData.playbookSlug === "string"
      ? customData.playbookSlug
      : typeof customData.playbook_slug === "string"
        ? customData.playbook_slug
        : undefined;

  return {
    eventName,
    orderId,
    email: attributes.email,
    variantId,
    status,
    total,
    currency,
    playbookSlug: slugValue,
  };
}

function buildDownloadUrl(orderId: string, fileKey: string): string {
  const baseUrl =
    process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = new URL("/api/download", baseUrl);
  url.searchParams.set("order", orderId);
  url.searchParams.set("file", fileKey);
  return url.toString();
}

export async function POST(request: Request) {
  const body = await request.text();
  let secret: string | undefined;

  try {
    secret = getLemonSqueezyWebhookSecret();
  } catch (error) {
    console.error("Webhook misconfiguration", error);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const signature = request.headers.get(SIGNATURE_HEADER);

  if (!verifySignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const json = JSON.parse(body);
    const parseResult = webhookSchema.safeParse(json);

    if (!parseResult.success) {
      console.error("Invalid webhook payload", parseResult.error);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const normalized = normalizeOrderPayload(parseResult.data);
    console.info("Received Lemon Squeezy webhook", {
      event: normalized.eventName,
      orderId: normalized.orderId,
      status: normalized.status,
    });

    if (!normalized.eventName.startsWith("order_")) {
      return NextResponse.json({ received: true }, { status: 202 });
    }

    const existingOrder = await findOrderByOrderId(normalized.orderId);

    const playbookSlug = normalized.playbookSlug ?? existingOrder?.playbookSlug;

    if (!playbookSlug) {
      console.warn("Order is missing playbook slug metadata", normalized.orderId);
    }

    let playbookFileKey: string | null | undefined;
    let playbookTitle: string | undefined;

    if (playbookSlug) {
      const playbook = await getPlaybook(playbookSlug);
      playbookFileKey = playbook?.fileKey;
      playbookTitle = playbook?.title;

      if (!playbook) {
        console.warn("Unable to load playbook for slug", playbookSlug);
      }
    }

    await upsertOrder({
      orderId: normalized.orderId,
      email: normalized.email,
      variantId: normalized.variantId,
      playbookSlug: playbookSlug ?? "unknown",
      status: normalized.status,
      total: normalized.total || existingOrder?.total || "0",
      currency: normalized.currency ?? existingOrder?.currency ?? null,
      downloadKey: playbookFileKey ?? existingOrder?.downloadKey ?? null,
    });

    const shouldSendFulfillment =
      normalized.status === "paid" && (!existingOrder || !existingOrder.fulfillmentSentAt);

    if (shouldSendFulfillment && playbookFileKey && playbookTitle) {
      const downloadUrl = buildDownloadUrl(normalized.orderId, playbookFileKey);
      const subject = `Your ${playbookTitle} playbook is ready`;
      const text = [
        `Thanks for your purchase!`,
        `You can download ${playbookTitle} using the secure link below (expires in 10 minutes).`,
        "",
        downloadUrl,
      ].join("\n");
      const html = `<!doctype html><html><body style="font-family:Inter,system-ui,-apple-system,sans-serif;line-height:1.6;color:#0f172a;">
  <h1 style="font-size:20px;margin-bottom:12px;">Thanks for your purchase!</h1>
  <p style="margin:0 0 12px 0;">Your copy of <strong>${playbookTitle}</strong> is ready. The link below expires in 10 minutes to keep your download secure.</p>
  <p style="margin:0 0 24px 0;"><a href="${downloadUrl}" style="background:#0f172a;color:#ffffff;padding:12px 18px;border-radius:9999px;text-decoration:none;display:inline-block;">Download your playbook</a></p>
  <p style="margin:0 0 12px 0;font-size:14px;color:#475569;">If the button above does not work, copy and paste this URL into your browser:</p>
  <p style="margin:0;font-size:14px;"><a href="${downloadUrl}" style="color:#0f172a;">${downloadUrl}</a></p>
</body></html>`;

      try {
        await sendEmail({
          to: normalized.email,
          subject,
          html,
          text,
        });
        await markOrderFulfilled(normalized.orderId, playbookFileKey);
      } catch (emailError) {
        console.error("Failed to send fulfillment email", emailError);
      }
    } else if (shouldSendFulfillment) {
      console.warn("Skipping fulfillment email due to missing playbook metadata", {
        orderId: normalized.orderId,
        playbookSlug,
        hasFileKey: Boolean(playbookFileKey),
      });
    }

    return NextResponse.json({ received: true }, { status: 202 });
  } catch (error) {
    console.error("Invalid webhook payload", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
