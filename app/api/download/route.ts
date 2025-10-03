import { NextResponse } from "next/server";
import { z } from "zod";

import { findOrderByOrderId } from "@/lib/db/orders";
import { createSignedDownload } from "@/lib/r2";
import { getPlaybook } from "@/lib/sanity/queries";

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
  const sanitizedFile = file.replace(/^\/+/, "");

  if (sanitizedFile.includes("..")) {
    return NextResponse.json({ error: "Invalid file reference" }, { status: 400 });
  }

  const orderRecord = await findOrderByOrderId(order);

  if (!orderRecord) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (orderRecord.status.toLowerCase() !== "paid") {
    return NextResponse.json({ error: "Order is not eligible for download" }, { status: 403 });
  }

  let permittedKey = orderRecord.downloadKey ?? null;

  if (!permittedKey && orderRecord.playbookSlug) {
    const playbook = await getPlaybook(orderRecord.playbookSlug);
    permittedKey = playbook?.fileKey ?? null;
  }

  if (permittedKey && permittedKey !== sanitizedFile) {
    return NextResponse.json({ error: "Download not permitted" }, { status: 403 });
  }

  const keyToSign = permittedKey ?? sanitizedFile;

  console.info("Issuing signed download", { order, key: keyToSign });

  try {
    const signed = await createSignedDownload({ key: keyToSign });
    return NextResponse.json(signed);
  } catch (error) {
    console.error("Failed to sign download", error);
    return NextResponse.json({ error: "Unable to generate download" }, { status: 500 });
  }
}

export function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
