import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getStripeClient, getStripeWebhookSecret } from "@/lib/commerce/stripe";
import { findOrderByOrderId, markOrderFulfilled, upsertOrder } from "@/lib/db/orders";
import { sendEmail } from "@/lib/email";
import { getPlaybook } from "@/lib/sanity/queries";

const SIGNATURE_HEADER = "stripe-signature";

export const dynamic = "force-dynamic";

function buildDownloadUrl(orderId: string, fileKey: string): string {
  const baseUrl =
    process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = new URL("/api/download", baseUrl);
  url.searchParams.set("order", orderId);
  url.searchParams.set("file", fileKey);
  return url.toString();
}

function formatAmount(amount: number | null | undefined): string {
  if (!amount) {
    return "0";
  }

  return (amount / 100).toFixed(2);
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const secret = getStripeWebhookSecret();

  if (!secret) {
    console.error("Stripe webhook secret is not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const signature = request.headers.get(SIGNATURE_HEADER);
  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", secret);
  } catch (error) {
    console.error("Invalid Stripe webhook signature", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true }, { status: 202 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? ({} as Stripe.Metadata);
    const getMetadataValue = (key: string) => {
      const value = metadata[key];
      return typeof value === "string" && value.length > 0 ? value : undefined;
    };
    const orderId = session.id;
    const email =
      session.customer_details?.email ??
      (typeof session.customer_email === "string" ? session.customer_email : undefined);

    if (!email) {
      throw new Error("Missing customer email on checkout session");
    }

    const priceId = getMetadataValue("priceId") ?? getMetadataValue("price_id");

    if (!priceId) {
      throw new Error("Checkout session missing price metadata");
    }

    const existingOrder = await findOrderByOrderId(orderId);
    const playbookSlug =
      getMetadataValue("playbookSlug") ?? getMetadataValue("playbook_slug") ?? existingOrder?.playbookSlug;

    if (!playbookSlug) {
      console.warn("Order is missing playbook slug metadata", orderId);
    }

    let playbookFileKey: string | null | undefined =
      getMetadataValue("fileKey") ?? getMetadataValue("file_key");
    let playbookTitle: string | undefined;

    if (playbookSlug) {
      const playbook = await getPlaybook(playbookSlug);
      playbookTitle = playbook?.title ?? undefined;
      playbookFileKey = playbook?.fileKey ?? playbookFileKey;

      if (!playbook) {
        console.warn("Unable to load playbook for slug", playbookSlug);
      }
    }

    console.info("Received Stripe webhook", {
      event: event.type,
      orderId,
      status: session.payment_status,
    });

    await upsertOrder({
      orderId,
      email,
      providerId: priceId,
      playbookSlug: playbookSlug ?? "unknown",
      status: session.payment_status ?? "unknown",
      total: formatAmount(session.amount_total ?? session.amount_subtotal ?? 0),
      currency: session.currency ? session.currency.toUpperCase() : existingOrder?.currency ?? null,
      downloadKey: playbookFileKey ?? existingOrder?.downloadKey ?? null,
    });

    const shouldSendFulfillment =
      (session.payment_status === "paid" || session.payment_status === "no_payment_required") &&
      (!existingOrder || !existingOrder.fulfillmentSentAt);

    if (shouldSendFulfillment && playbookFileKey && playbookTitle) {
      const downloadUrl = buildDownloadUrl(orderId, playbookFileKey);
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
          to: email,
          subject,
          html,
          text,
        });
        await markOrderFulfilled(orderId, playbookFileKey);
      } catch (emailError) {
        console.error("Failed to send fulfillment email", emailError);
      }
    } else if (shouldSendFulfillment) {
      console.warn("Skipping fulfillment email due to missing playbook metadata", {
        orderId,
        playbookSlug,
        hasFileKey: Boolean(playbookFileKey),
      });
    }

    return NextResponse.json({ received: true }, { status: 202 });
  } catch (error) {
    console.error("Failed to process Stripe webhook", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

