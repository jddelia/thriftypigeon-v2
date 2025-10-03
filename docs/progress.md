# Build Progress Log

## 2025-10-03
- Initialized Next.js 14 project structure with App Router.
- Stubbed core Sanity queries with graceful fallbacks for local development.
- Scaffolded primary routes (home, posts, playbooks, subscribe flows) and API endpoints for checkout, webhooks, downloads, preview, and revalidation.
- Added provider adapters for Lemon Squeezy, Resend email, R2 storage, and database access layers using Drizzle + Postgres.
- Established site-wide layout components and placeholder content to enable fast iteration.
- Pending: wire real database tables, implement webhook normalization, secure download validation, and connect Turnstile + ESP integrations.
