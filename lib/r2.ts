import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

export interface SignedDownloadRequest {
  key: string;
  expiresInSeconds?: number;
}

export interface SignedDownloadResponse {
  url: string;
  expiresAt: string;
}

const r2EnvSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1, "Set R2_ACCOUNT_ID"),
  R2_ACCESS_KEY_ID: z.string().min(1, "Set R2_ACCESS_KEY_ID"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "Set R2_SECRET_ACCESS_KEY"),
  R2_BUCKET_NAME: z.string().min(1, "Set R2_BUCKET_NAME"),
  R2_PUBLIC_DOMAIN: z.string().url().optional(),
});

let cachedClient: S3Client | null = null;

function getR2Client(env: z.infer<typeof r2EnvSchema>) {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return cachedClient;
}

export async function createSignedDownload({
  key,
  expiresInSeconds = 600,
}: SignedDownloadRequest): Promise<SignedDownloadResponse> {
  if (!key) {
    throw new Error("createSignedDownload requires an object key");
  }

  const fallbackBaseUrl = process.env.R2_PUBLIC_DOMAIN ?? "https://r2.thethriftypigeon.test";
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  const envResult = r2EnvSchema.safeParse(process.env);

  if (!envResult.success) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Invalid R2 configuration: ${envResult.error.message}`);
    }

    console.warn("R2 environment is incomplete. Returning fallback URL.");
    return {
      url: `${fallbackBaseUrl}/${encodeURIComponent(key)}?token=dev`,
      expiresAt,
    } satisfies SignedDownloadResponse;
  }

  const env = envResult.data;
  const client = getR2Client(env);
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return {
    url: signedUrl,
    expiresAt,
  } satisfies SignedDownloadResponse;
}
