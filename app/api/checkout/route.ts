import { NextResponse } from "next/server";
import { z } from "zod";

import { createCheckoutSession } from "@/lib/commerce/stripe";
import { getPlaybook } from "@/lib/sanity/queries";

const payloadSchema = z.object({
  slug: z.string().min(1, "slug is required"),
  email: z.string().email().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parseResult = payloadSchema.safeParse(json);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  return handleCheckout(parseResult.data);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("playbook") ?? searchParams.get("slug");
  const email = searchParams.get("email") ?? undefined;
  const parseResult = payloadSchema.safeParse({ slug, email });

  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sessionResponse = await handleCheckout(parseResult.data);

  if (sessionResponse.status === 201) {
    const session = (await sessionResponse.json()) as {
      id: string;
      url: string;
      expiresAt: string;
    };
    return NextResponse.redirect(session.url, { status: 307 });
  }

  return sessionResponse;
}

async function handleCheckout(input: z.infer<typeof payloadSchema>) {
  const { slug, email } = input;
  const playbook = await getPlaybook(slug);

  if (!playbook) {
    return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
  }

  if (!playbook.stripePriceId) {
    return NextResponse.json({ error: "Playbook is not ready for checkout" }, { status: 409 });
  }

  try {
    const session = await createCheckoutSession({
      priceId: playbook.stripePriceId,
      email,
      metadata: {
        playbookSlug: playbook.slug,
        ...(playbook.fileKey ? { fileKey: playbook.fileKey } : {}),
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Failed to create checkout session", error);
    return NextResponse.json({ error: "Unable to create checkout session" }, { status: 500 });
  }
}
