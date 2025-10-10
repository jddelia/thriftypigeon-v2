# Stripe Migration Checklist

This document tracks the migration of the payment stack from Lemon Squeezy to Stripe.

## Objectives

- [x] Replace Lemon Squeezy checkout flow with Stripe Checkout Sessions.
- [x] Replace Lemon Squeezy webhook ingestion with Stripe webhook processing.
- [x] Update Sanity schemas and queries to surface Stripe price IDs.
- [x] Update order persistence to use provider-agnostic identifiers.
- [x] Document required environment variables and operator actions.

## Follow-up actions for operators

These items require manual work outside of the codebase:

1. **Create Stripe resources**
   - Set up a Stripe account (or enable test mode on an existing account).
   - Create a _Product_ for each playbook and at least one recurring or one-time _Price_. Capture the `price_xxx` identifiers.
2. **Configure environment variables**
   - `STRIPE_SECRET_KEY` (test or live key depending on environment)
   - `STRIPE_WEBHOOK_SECRET` (generated from the webhook endpoint registered below)
   - Update `SITE_URL` / `NEXT_PUBLIC_SITE_URL` if not already set so hosted Checkout knows where to redirect customers.
3. **Register webhook endpoint**
   - Add `https://<your-domain>/api/webhooks/stripe` (or the ngrok equivalent) in the Stripe Dashboard with at least the `checkout.session.completed` event subscribed.
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET` for each environment.
4. **Update Sanity content**
   - For every playbook, replace the `Provider Data → Stripe Price ID` field with the appropriate Stripe price identifier.
   - Publish the documents so the new data is available to the Next.js app.
5. **Database migration** (if an orders table already exists)
   - Rename the `variant_id` column on the `orders` table to `provider_id`:
     ```sql
     ALTER TABLE orders RENAME COLUMN variant_id TO provider_id;
     ```
   - Deploy this migration to every environment where the table exists.

## QA checklist

- [ ] Test POST `/api/checkout` in development with a test price to confirm a Checkout Session URL is returned.
- [ ] Complete a test payment and verify the `/api/webhooks/stripe` handler persists the order and sends the download email.
- [ ] Validate that download links in the fulfillment email resolve correctly.
- [ ] Remove or archive Lemon Squeezy credentials from environment stores once Stripe is live.

