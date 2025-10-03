import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { getLemonSqueezyWebhookSecret } from "@/lib/commerce/lemonsqueezy";

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
    const payload = JSON.parse(body) as Record<string, unknown>;
    console.info("Received Lemon Squeezy webhook", payload.event);
    // TODO: persist the order + trigger fulfillment.
    return NextResponse.json({ received: true }, { status: 202 });
  } catch (error) {
    console.error("Invalid webhook payload", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
