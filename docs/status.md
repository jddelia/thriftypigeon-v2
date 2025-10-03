# Engineering Status

## Completed
- Normalized Lemon Squeezy webhook payloads, persist paid orders, and trigger fulfillment emails with expiring download links.
- Secured the `/api/download` endpoint behind paid-order checks and Cloudflare R2 signed URLs.
- Added reusable database utilities for finding, upserting, and marking orders without requiring a local Postgres instance.
- Hardened environment configuration for database and R2 access, preventing silent misconfiguration in production.

## Next Steps
- Implement subscriber double opt-in flows, ESP synchronization, and Turnstile protection for the newsletter form.
- Backfill order and subscriber migrations with Drizzle schema migrations and seed scripts.
- Build admin views for orders/subscribers gated behind Cloudflare Access or basic auth.
- Add observability integrations (Sentry, logging) and automated tests for commerce workflows.

## Notes
- Set `SITE_URL`, `DATABASE_URL`, and all Cloudflare R2 + Lemon Squeezy secrets in deployment environments.
- When running locally without Postgres, webhook processing will log a warning but still attempt to send fulfillment emails.
- R2 signed URLs expire after 10 minutes; adjust `expiresInSeconds` in `createSignedDownload` if product requirements change.
