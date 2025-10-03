import { z } from "zod";

const runtimeEnvSchema = z.object({
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),
});

const checkoutEnvSchema = z.object({
  LEMONSQUEEZY_API_KEY: z.string().min(1, "Set LEMONSQUEEZY_API_KEY"),
  LEMONSQUEEZY_STORE_ID: z
    .coerce
    .number()
    .int()
    .positive("LEMONSQUEEZY_STORE_ID must be a positive integer"),
});

export type LemonSqueezyCheckoutPayload = {
  variantId: string;
  email?: string;
  metadata?: Record<string, string>;
};

export interface LemonSqueezyCheckoutResponse {
  url: string;
  expiresAt: string;
}

export function getLemonSqueezyWebhookSecret(): string | undefined {
  const parsed = runtimeEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data.LEMONSQUEEZY_WEBHOOK_SECRET;
}

export function readLemonSqueezyCheckoutEnv() {
  const parsed = checkoutEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid Lemon Squeezy configuration: ${message}`);
  }

  return parsed.data;
}

export async function createCheckoutSession(
  payload: LemonSqueezyCheckoutPayload,
): Promise<LemonSqueezyCheckoutResponse> {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    console.info("Simulating Lemon Squeezy checkout", payload);
    return {
      url: `https://checkout.lemonsqueezy.com/buy/${payload.variantId}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    } satisfies LemonSqueezyCheckoutResponse;
  }

  const env = readLemonSqueezyCheckoutEnv();

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_options: {
            embed: true,
            media: false,
          },
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
        relationships: {
          store: {
            data: { type: "stores", id: String(env.LEMONSQUEEZY_STORE_ID) },
          },
          variant: {
            data: { type: "variants", id: payload.variantId },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create Lemon Squeezy checkout: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as {
    data: { attributes: { url: string; expires_at: string } };
  };

  return {
    url: data.data.attributes.url,
    expiresAt: data.data.attributes.expires_at,
  } satisfies LemonSqueezyCheckoutResponse;
}
