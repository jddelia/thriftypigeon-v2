import { NextResponse } from "next/server";
import { z } from "zod";

import { createSignedDownload } from "@/lib/r2";

const querySchema = z.object({
  order: z.string().min(1),
  file: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parseResult = querySchema.safeParse(Object.fromEntries(searchParams));

  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid download request" }, { status: 400 });
  }

  const { order, file } = parseResult.data;

  // TODO: verify order ownership via Postgres before issuing the signed URL.
  console.info("Issuing signed download", { order, file });

  try {
    const signed = await createSignedDownload({ key: file });
    return NextResponse.json(signed);
  } catch (error) {
    console.error("Failed to sign download", error);
    return NextResponse.json({ error: "Unable to generate download" }, { status: 500 });
  }
}

export function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
