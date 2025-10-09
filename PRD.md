# The Thrifty Pigeon PRD

## Project Overview

A fast, editorially credible blog about saving + making money, with premium Playbooks (PDF blueprints). Playbooks will sometimes appear in certain blog posts and match specific content of list item, and provide a detailed and comprehensive plan. Content lives in Sanity, the site runs on Next.js.

**The Thrifty Pigeon** uses **Sanity** for content, **Stripe** for commerce, and **Cloudflare + self‑hosted on Hetzner** for delivery. It’s engineered to ship fast **and** scale cleanly—no dead ends.

---

## TL;DR (executive summary)

* **Frontend/App**: **Next.js (App Router, Node 20)**
* **Content**: **Sanity v3** (+ Visual Editing/Preview)
* **Commerce**: **Stripe Checkout** via a clean **Provider Adapter** so future providers can be added with minimal rewrites
* **Infra**: **Hetzner Cloud VM** (Docker) + **Cloudflare Tunnel** (no public ports) + **Cloudflare WAF/CDN/Turnstile**
* **Storage**: **Cloudflare R2 (private)** for PDFs, delivered via **short‑lived signed URLs**
* **DB**: **Postgres (Neon)** + **Drizzle** (own your Orders/Subscribers)
* **Email**: **Resend** for transactional; **Newsletter Adapter** for ESP (Buttondown/ConvertKit) with **double opt‑in**; canonical subscribers in Postgres
* **Security/Observability**: Cloudflare WAF, Turnstile, rate‑limits, Sentry, structured logs
* **Deployment**: **Coolify** on Hetzner (recommended) or Docker Compose + Watchtower
* **Why this works**: You get Cloudflare’s edge performance & protection, zero‑toil hosting on a cheap, fast Hetzner VM, and portable business primitives (Content, Orders, Subscribers) that don’t lock you into a payment provider.

---

# PRODUCT REQUIREMENTS — **The Thrifty Pigeon** (MVP)

## 1) Goals & Non‑Goals

**Goals**

* Publish Sanity‑managed articles with instant preview and near‑instant publish to production (ISR + webhooks).
* Sell 1+ **Playbook** via **Stripe Checkout** with zero checkout friction.
* Fulfill securely: **email + expiring signed download link** backed by R2.
* Build & own the **order ledger** and **subscriber list** in Postgres.
* Baseline anti‑abuse (Turnstile + WAF + rate‑limits) and full observability.

**Non‑Goals (MVP)**

* User accounts / “My Library”
* Subscriptions/memberships/courses
* Affiliate dashboards (keep a simple attribution field only)

---

## 2) Users & Value

* **Audience**: doers who want **actionable ways** to save/make money.
* **Promise**: “Skip the trial‑and‑error. Copy a proven system tonight.”

---

## 3) Scope

### Public

* **Home**: brand promise, featured playbook, latest posts, newsletter capture
* **Post**: long‑form (Sanity Portable Text) with **inline CTA** and footer CTA
* **(Optional) Playbook landing**: “What’s inside”, FAQ, price, single **Buy** button
* **Thank‑you**: purchase confirmation (Stripe can also send theirs)
* **Legal**: Terms, Privacy, Refunds, Disclosures (YMYL/affiliate)

### Commerce & Fulfillment

* **Checkout**: Stripe Checkout Session via **/api/checkout** (server‑created)
* **Webhook**: Stripe → `/api/webhooks/stripe` → normalized **Order** row
* **Delivery**: email with link to `/api/download?order=...&file=...` → server validates → **R2 signed URL (10 min)**

### Newsletter

* **Subscribe** (Turnstile) → **double opt‑in** (Resend) → **ESP sync** (Buttondown/ConvertKit)
* **Unsub** events from ESP → webhook → mirror to our DB
* **Newsletter issues** authored in Sanity (optional public archive page)

### Admin (MVP‑light)

* `/admin/orders` (read‑only; resend email)
* `/admin/subscribers` (read‑only status)
  Protected by **Cloudflare Access** (Zero Trust) or Basic Auth.

---

## 4) System Architecture (Cloudflare + Hetzner)

**Why this exact shape?**
It’s secure (no open origin ports), fast (edge cache), cheap (Hetzner), and portable.

```
[User]
  │
  ▼
Cloudflare (DNS, WAF, CDN, Turnstile, Bot Mgmt)
  │   └─ Cache Rules: static assets; never cache /api/*
  │
  ▼
Cloudflare Tunnel (cloudflared sidecar on VM)  ← no public inbound ports
  │
  ▼
Hetzner VM (Ubuntu 22/24 + Docker)
  ├─ Next.js container (Node 20 "standalone")
  ├─ cloudflared container (tunnel)
  └─ (optional) Caddy/NGINX only if you want mTLS / origin cert checks

External managed services:
  • Sanity (content)
  • R2 (private PDFs)
  • Neon Postgres
  • Resend (transactional)
  • Buttondown/ConvertKit (newsletter)
  • Sentry/Better Stack (observability)
```

**Coolify vs alternatives**

* **Coolify** (recommended): dead‑simple Git deploys, env management, health checks.
* **CapRover**: also fine; slightly more DIY.
* **Bare Docker Compose** + **Watchtower**: lean and reliable, but fewer QoL features.

**Security hardening**

* Tunnel only (no open ports).
* Cloudflare **WAF + Bot Fight** on; **Turnstile** on forms.
* **Rate‑limit** rules on `/api/checkout`, `/api/download`, `/api/webhooks/*`.
* Parse real client IP from `CF-Connecting-IP` (important for logs/rate‑limits).
* Rotate all webhook secrets; store only the minimum PII.

---

## 5) Tech Stack (production‑grade)

* **Framework**: Next.js (App Router), TypeScript, Node 20
* **Content**: Sanity v3 + `next-sanity` + Visual Editing/Preview
* **Styling**: Tailwind CSS + Radix UI + accessible custom components
* **Payments**: Stripe Checkout Sessions via official API
* **DB**: Postgres (Neon) + Drizzle ORM + migrations in repo
* **Storage**: Cloudflare R2 (S3 API) private bucket
* **Email**: Resend (transactional); Buttondown or ConvertKit (newsletter) via **adapter**
* **Security**: Cloudflare Turnstile, WAF rules, app‑level rate‑limits (sliding window)
* **Analytics**: Plausible (traffic), PostHog (funnel/flags)
* **Observability**: Sentry (FE/BE), Better Stack/Logtail (JSON logs)
* **CI/CD**: GitHub Actions → build image → deploy to Coolify app

---

## 6) Content Model (Sanity)

**Singletons**

* `siteSettings`: site name, logo, theme, nav/footer, default SEO, provider defaults
* `homePage`: hero blurb, featured playbook/post, newsletter block

**Documents**

* `post`: title, slug, excerpt, cover, body (Portable Text), authors[], tags[], publishAt, SEO, **ctaBlocks[]**
* `playbook`: title, slug, excerpt, cover, **sku**, **fileKey**, **defaultProvider="stripe"**, `providerData` (Stripe price IDs/metadata), “what’s inside”, FAQ[], version, lastUpdated, SEO
* `ctaBlock`: type (hero/inline/footer), copy, bullets, playbook ref, style
* `author`, `tag`, `newsletterIssue` (optional archive)

**Notes**

* Store **Stripe price** identifier(s) here; the app calls `/api/checkout` with the `slug` and reads pricing config from Sanity.

---

## 7) Data Model (Postgres, Drizzle)

```ts
// customers
id (pk), email (unique), created_at

// orders (normalized)
id (pk), customer_id (fk), provider ('stripe'),
provider_customer_id, provider_order_id (unique),
product_sku, amount_cents, currency, status ('succeeded'|'refunded'|'failed'),
receipt_url, created_at

// downloads
id (pk), order_id (fk), file_key, served_at, ip, user_agent

// subscribers (canonical)
id (pk), email (unique), status ('pending'|'subscribed'|'unsubscribed'|'bounced'),
consent_source ('form'|'checkout'),
consent_at, consent_ip,
esp_provider ('buttondown'|'convertkit'|null),
esp_subscriber_id (nullable), last_synced_at, created_at

// webhooks (idempotency log)
id (pk), provider, event_id (unique), event_type, received_at, payload_hash
```

---

## 8) API Contracts

**POST `/api/checkout`**
Req: `{ slug: string; email?: string }`
Res: `{ id: string; url: string; expiresAt: string }` (Stripe Checkout Session)
Guards: Turnstile (token), rate‑limit (5/min/IP)

**POST `/api/webhooks/stripe`**
Headers: signature (verify), Raw body: required
Behavior: upsert customer, insert order (idempotent on `checkout_session_id`), queue **sendDownloadEmail(orderId)**

**GET `/api/download?order=...&file=...`**
Auth: verify order belongs to file (by `product_sku → file_key`) and `status='succeeded'`
Action: log `downloads`, generate **R2 signed URL (600s)**, `302` redirect
Guards: rate‑limit (10/min/IP)

**GET `/api/preview`** (Sanity preview/draft mode)
**POST `/api/revalidate`** (Sanity webhook → tag/path revalidation)

**POST `/api/newsletter/subscribe`**
Req: `{ email: string }` + Turnstile
Action: insert `subscribers(status='pending')` → send confirm (Resend)

**GET `/subscribe/confirm?token=...`**
Action: verify token → flip to `subscribed` → upsert in ESP → set `esp_*` fields

**POST `/api/webhooks/newsletter`**
Source: ESP → reflect unsub/bounce → update our `subscribers`

---

## 9) Stripe integration (MVP details)

* Use Stripe **Checkout Sessions**; populate price IDs from `playbook.providerData`.
* Webhooks to capture: `checkout.session.completed` (add refunds/expired events later if needed).
* You **own the receipt+download email**: send your branded email with your **/api/download** link (Stripe also emails receipts if enabled).
* **Idempotency**: store Stripe `event.id` and Checkout Session `id`; reject duplicates.

---

## 10) Storage & Delivery (R2)

* Bucket: `thrifty-pigeon` (private)
* Keys: `playbooks/<sku>-v<version>.pdf` (but expose as stable `fileKey` in Sanity; version is informational)
* Generate pre‑signed URLs from the Next server using S3‑compatible SDK (R2 endpoint).
* Response headers: `Cache-Control: private, no-store`; `Content-Disposition: inline; filename="..."`

Optional **PDF stamping**: embed buyer email + order ID footer at request time (using `pdf-lib`) **only if** CPU budget is fine; otherwise skip in MVP.

---

## 11) Email System (design)

**Transactional (Resend)**

* Templates:

  * **Order Success**: “Your download is ready” (big button → `/api/download`) + plain‑text link fallback; include support + refund policy link.
  * **Confirm Subscription**: single CTA magic link.
* Deliverability: DKIM/SPF/DMARC on `mail.thethriftypigeon.com`; avoid link trackers; include text part.

**Newsletter (Adapter)**

* Start with **Buttondown** (dev‑friendly).
* We store **canonical** subscribers and **sync** to ESP (on confirm).
* Unsubs and bounces flow back to us via webhook.
* Newsletter issues authored in Sanity → publish as web post → send via ESP (manual or API).

---

## 12) Caching & Performance

* Cloudflare **Cache Rules**:

  * Cache static assets aggressively (`_next/static`, images).
  * **Bypass** `/api/*`, preview, and download routes.
  * HTML pages: use **standard browser caching** + Next ISR; you can add a “Cache Everything” rule for `/posts/*` later if you set `Cache-Control` correctly and exclude preview cookies.

* Next **ISR**: use `revalidateTag('post:<slug>')`/`revalidatePath` on Sanity webhook so publishes land in seconds.

* Images: Sanity assets → `@sanity/image-url` → Next/Image; Cloudflare will cache the transformed images at the edge.

Performance budgets: LCP < 2.5s, CLS < 0.1, TTI < 3.5s on mid‑tier mobile.

---

## 13) Security & Abuse

* **Cloudflare Turnstile** on subscribe and (optionally) on CTA modal before checkout.
* **WAF & Bot** on; block obvious L7 junk.
* **Rate‑limit**: Cloudflare rules + app middleware (per IP + per email).
* **Cloudflare Tunnel** (cloudflared) for origin—no open ports.
* Log real IP via `CF-Connecting-IP`.
* Webhook signature verification; keep raw body; store payload hash in `webhooks` table.

---

## 14) Observability

* **Sentry** (frontend & server) with release names and sourcemaps.
* **Structured JSON logs** (pino) shipped to **Better Stack/Logtail**.
* Health endpoint `/api/health` for Coolify to probe.
* Weekly cron (Cloudflare Cron calling a public endpoint) to reconcile Stripe → our ledger (paranoid check).

---

## 15) Information Architecture & URLs

* `/` Home
* `/posts/[slug]` Article (from Sanity)
* `/playbooks/[slug]` (optional)
* `/thank-you/[sessionId]` (for Stripe later; LS may return to `/`)
* `/subscribe`, `/subscribe/confirm`
* `/privacy`, `/terms`, `/refunds`, `/disclosures`
* `/studio` (Sanity Studio) → protect with Cloudflare Access
* `/admin/orders`, `/admin/subscribers` (read‑only; protected)

---

## 16) Acceptance Criteria (MVP)

* **Publishing**: Create/edit in Sanity; preview works; publish visible **<60s**.
* **Checkout**: From CTA click → Stripe checkout → success → order row in DB; **email sent <60s**.
* **Download**: Link works on mobile/desktop; expires gracefully; logs `downloads`.
* **Newsletter**: Double opt‑in flow succeeds; ESP shows subscriber; unsubscribe syncs back.
* **Perf/SEO**: Correct meta + schema; sitemap, robots; LCP < 2.5s.
* **Security**: All webhooks verified; tunnel only; rate‑limits enforced.
* **Ops**: Errors appear in Sentry; logs structured; health checks green.

---

## 17) Minimal file map

```
/app
  /(site)
    /page.tsx
    /posts/[slug]/page.tsx
    /playbooks/[slug]/page.tsx
    /subscribe/page.tsx
    /subscribe/confirm/page.tsx
  /api
    /checkout/route.ts               # Stripe checkout init
    /webhooks/stripe/route.ts        # verify -> order -> email
    /download/route.ts               # validate -> R2 signed URL
    /preview/route.ts
    /revalidate/route.ts

  /lib
    /sanity/{client,queries,types}.ts
    /commerce/stripe.ts
    /r2.ts
    /email.ts
    /db/{client,drizzle,schemas}.ts
    /rateLimit.ts
    /analytics.ts

/sanity   # Sanity Studio (protected)

/styles, /components, /utils
```

---

## 18) Strong opinions (so you don’t stall)

* **Use Cloudflare Tunnel**. Do **not** expose origin ports; skip NGINX unless you need mTLS.
* **Own** Orders & Subscribers in Postgres even if Stripe stores them—portability matters.
* **Self‑host downloads** in R2; Stripe can also host files, but your flow stays consistent across providers.
* **Sanity** drives pricing/IDs via `playbook.providerData`; checkout code never touches constants.
* Start with **Buttondown** for newsletters (fastest dev); keep adapter so ConvertKit is a 1‑file swap.
* **No accounts** in MVP. If/when you add a Library, your storage and ledger are already ready.

