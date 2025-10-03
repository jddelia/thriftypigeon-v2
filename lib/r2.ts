export interface SignedDownloadRequest {
  key: string;
  expiresInSeconds?: number;
}

export interface SignedDownloadResponse {
  url: string;
  expiresAt: string;
}

export async function createSignedDownload({
  key,
  expiresInSeconds = 600,
}: SignedDownloadRequest): Promise<SignedDownloadResponse> {
  if (!key) {
    throw new Error("createSignedDownload requires an object key");
  }

  const baseUrl = process.env.R2_PUBLIC_DOMAIN ?? "https://r2.thethriftypigeon.test";
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  if (process.env.NODE_ENV !== "production") {
    return {
      url: `${baseUrl}/${encodeURIComponent(key)}?token=dev`,
      expiresAt,
    } satisfies SignedDownloadResponse;
  }

  // TODO: integrate with Cloudflare R2 signed URL API using access keys.
  throw new Error("R2 signing is not configured yet");
}
