import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  type: z.string(),
  slug: z.string().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { type, slug } = parsed.data;

  if (type === "post" && slug) {
    revalidatePath(`/posts/${slug}`);
    revalidateTag(`post:${slug}`);
  }

  if (type === "home") {
    revalidatePath("/");
  }

  return NextResponse.json({ revalidated: true });
}
