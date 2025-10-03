import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  secret: z.string().min(1),
  slug: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preview request" }, { status: 400 });
  }

  if (parsed.data.secret !== process.env.SANITY_PREVIEW_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  draftMode().enable();
  return NextResponse.redirect(new URL(`/posts/${parsed.data.slug}`, request.url));
}
