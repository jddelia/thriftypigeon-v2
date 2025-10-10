import Stripe from "stripe";
import { z } from "zod";

const runtimeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1, "Set STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SITE_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
});

export type StripeCheckoutPayload = {
  priceId: string;
  email?: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
};

export interface StripeCheckoutResponse {
  id: string;
  url: string;
  expiresAt: string;
}

let stripeClient: Stripe | null = null;

function loadEnv() {
  const parsed = runtimeEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid Stripe configuration: ${message}`);
  }

  return parsed.data;
}

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const env = loadEnv();

  stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
    appInfo: {
      name: "Thrifty Pigeon",
    },
  });

  return stripeClient;
}

export function getStripeWebhookSecret(): string | undefined {
  const env = loadEnv();
  return env.STRIPE_WEBHOOK_SECRET;
}

function resolveBaseUrl(): string {
  const env = loadEnv();
  const fallback = "http://localhost:3000";
  const baseUrl = env.SITE_URL ?? env.NEXT_PUBLIC_SITE_URL ?? fallback;

  if (baseUrl.endsWith("/")) {
    return baseUrl.slice(0, -1);
  }

  return baseUrl;
}

export async function createCheckoutSession(
  payload: StripeCheckoutPayload,
): Promise<StripeCheckoutResponse> {
  const stripe = getStripeClient();
  const baseUrl = resolveBaseUrl();
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price: payload.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      priceId: payload.priceId,
      ...payload.metadata,
    },
    client_reference_id: payload.metadata?.playbookSlug,
    customer_email: payload.email,
    billing_address_collection: "auto",
    allow_promotion_codes: true,
    success_url:
      payload.successUrl ?? `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:
      payload.cancelUrl ??
      `${baseUrl}/playbooks/${payload.metadata?.playbookSlug ?? ""}?cancelled=1`,
    expires_at: expiresAt,
  });

  if (!session.url || !session.expires_at) {
    throw new Error("Stripe did not return a hosted checkout URL");
  }

  return {
    id: session.id,
    url: session.url,
    expiresAt: new Date(session.expires_at * 1000).toISOString(),
  } satisfies StripeCheckoutResponse;
}

