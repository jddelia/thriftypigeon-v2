# Stripe Webhook Setup Guide

This guide explains how to configure Stripe webhooks for both local development and production deployments.

## Prerequisites

- Stripe account with API access
- `STRIPE_SECRET_KEY` configured in your `.env` file
- Application server reachable at `https://<your-domain>/api/webhooks/stripe`

## 1. Create the webhook endpoint

1. Sign in to the [Stripe Dashboard](https://dashboard.stripe.com/).
2. Navigate to **Developers → Webhooks**.
3. Click **Add endpoint** and enter your callback URL:
   - **Local (ngrok)**: `https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app/api/webhooks/stripe`
   - **Production**: `https://yourdomain.com/api/webhooks/stripe`
4. Select the following events:
   - `checkout.session.completed`
   - (Optional) `checkout.session.expired` if you want to add cleanup hooks later
5. Click **Add endpoint** to save.

## 2. Copy the signing secret

1. From the webhook detail page, click **Reveal** under **Signing secret**.
2. Copy the value and add it to your `.env` file:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Restart the Next.js dev server after updating environment variables.

## 3. Local development tips

- Use `stripe listen --forward-to localhost:3000/api/webhooks/stripe` as an alternative to ngrok.
- Ensure your local `.env.local` contains `SITE_URL` or `NEXT_PUBLIC_SITE_URL` pointing to the ngrok domain so hosted Checkout can redirect properly.
- Trigger a test payment with Stripe test cards (e.g., `4242 4242 4242 4242`) to verify the flow end-to-end.

## 4. Production checklist

- Update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` with live-mode values.
- Confirm that the production domain is serving HTTPS and publicly reachable.
- Rotate webhook secrets if the previous integration is being retired.

## 5. Troubleshooting

- **400 Invalid signature**: Ensure the webhook secret in `.env` matches the environment (test vs live) and that the request body is passed through unmodified.
- **500 Server misconfigured**: Indicates `STRIPE_WEBHOOK_SECRET` is missing. Revisit the environment configuration.
- **Missing file downloads**: Confirm each playbook in Sanity has an associated `fileKey` so fulfillment emails can include download links.

For a full overview of the migration and outstanding tasks, see `docs/payments-stripe-migration.md`.

