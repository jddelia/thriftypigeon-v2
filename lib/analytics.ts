export interface LogEventOptions {
  type: string;
  metadata?: Record<string, unknown>;
}

export function logEvent({ type, metadata }: LogEventOptions) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`analytics:${type}`, metadata ?? {});
    return;
  }

  // TODO: ship structured logs to Better Stack or Sentry
  console.log(JSON.stringify({ type, metadata, timestamp: new Date().toISOString() }));
}
