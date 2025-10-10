# The Thrifty Pigeon

An editorial-first commerce site for actionable money playbooks. This repository houses the Next.js 14 application, Sanity integrations, and adapters for Stripe, Resend, Cloudflare R2, and Postgres.

## Getting started

```bash
npm install
npm run dev
```

By default the site boots with fallback data so you can explore without connecting external services. When you are ready to integrate providers set the following environment variables:

```env
# Sanity
SANITY_PROJECT_ID=
SANITY_DATASET=
SANITY_API_VERSION=2024-05-01
SANITY_PREVIEW_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Database (Neon or Postgres)
DATABASE_URL=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Cloudflare R2
R2_PUBLIC_DOMAIN=
```

## Key directories

- `app/` – Next.js App Router pages and API routes.
- `lib/` – Integrations for Sanity, Stripe, email, rate limiting, analytics, and storage helpers.
- `components/` – Reusable UI primitives (header, footer, PortableText renderer).
- `docs/progress.md` – Running scratchpad documenting implementation progress.

## Development roadmap

- [ ] Persist orders and subscribers with Drizzle migrations.
- [ ] Implement Stripe webhook normalization and fulfillment email.
- [ ] Add newsletter double opt-in flow with Cloudflare Turnstile and ESP sync.
- [ ] Harden download endpoint with order validation and signed R2 links.
- [ ] Instrument Sentry, Better Stack logging, and Cloudflare Turnstile.
