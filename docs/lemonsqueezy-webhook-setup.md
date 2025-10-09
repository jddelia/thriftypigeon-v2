# Lemon Squeezy Webhook Setup Guide (Archived)

> [!IMPORTANT]
> Lemon Squeezy is currently paused in favor of Stripe. The instructions below are retained for historical context only and should not be used for new environments. Refer to `docs/stripe-webhook-setup.md` for the active payment flow.

This guide walks you through setting up Lemon Squeezy webhooks for local development and production.

## Prerequisites

- Lemon Squeezy account with a store created
- `LEMONSQUEEZY_API_KEY` and `LEMONSQUEEZY_STORE_ID` already in your `.env` file
- [ngrok](https://ngrok.com/) installed for local testing

## Local Development Setup

### 1. Install and Configure ngrok

```bash
# Install ngrok (macOS)
brew install ngrok

# Or download from https://ngrok.com/download

# Sign up for a free ngrok account at https://dashboard.ngrok.com/signup
# Then authenticate your local ngrok installation
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
```

### 2. Start Your Development Server

```bash
npm run dev
```

Your Next.js app should be running on `http://localhost:3000` (or another port if 3000 is taken).

### 3. Start ngrok Tunnel

In a new terminal window:

```bash
ngrok http 3000
```

You'll see output like:

```
Forwarding   https://abc123def456.ngrok-free.app -> http://localhost:3000
```

**Copy the `https://` URL** - this is your webhook endpoint base.

### 4. Create Webhook in Lemon Squeezy

1. Go to [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com/)
2. Navigate to **Settings → Webhooks**
3. Click **"+ Create Webhook"**
4. Configure the webhook:
   - **Callback URL**: `https://YOUR-NGROK-URL.ngrok-free.app/api/webhooks/lemonsqueezy`
   - **Signing Secret**: Click "Generate" to create a new secret
   - **Events**: Select the following:
     - `order_created`
     - `order_refunded`
   - Click **"Create Webhook"**

5. **Copy the signing secret** and add it to your `.env` file:

```env
LEMONSQUEEZY_WEBHOOK_SECRET=your_signing_secret_here
```

6. Restart your development server to load the new environment variable.

### 5. Test the Webhook

#### Test with Lemon Squeezy's Test Mode

1. In your Lemon Squeezy dashboard, ensure you're in **Test Mode** (toggle in top-right)
2. Create a test product/variant if you haven't already
3. Ensure you have a playbook in Sanity with:
   - A `slug` field (e.g., "first-dollar-playbook")
   - A `lemonsqueezyVariantId` field set to your test variant ID
4. Trigger a test purchase:
   ```bash
   # Use your playbook slug from Sanity
   curl -X POST http://localhost:3000/api/checkout \
     -H "Content-Type: application/json" \
     -d '{
       "slug": "your-playbook-slug",
       "email": "test@example.com"
     }'
   ```

   Or test with a GET request in your browser:
   ```
   http://localhost:3000/api/checkout?slug=your-playbook-slug&email=test@example.com
   ```
5. Complete the checkout in the returned URL
6. Check your terminal for webhook logs:
   ```
   Received Lemon Squeezy webhook { event: 'order_created', orderId: '123', status: 'pending' }
   ```

#### Test Webhook Manually

Send a test webhook event from Lemon Squeezy dashboard:

1. Go to **Settings → Webhooks**
2. Click on your webhook
3. Click **"Send test event"**
4. Select `order_created`
5. Check your local server logs for the event

### 6. Verify Signature Validation

The webhook route at `/app/api/webhooks/lemonsqueezy/route.ts` automatically validates signatures using the `LEMONSQUEEZY_WEBHOOK_SECRET`.

**If signature validation fails:**
- Double-check the webhook secret in `.env` matches Lemon Squeezy
- Restart your dev server after changing `.env`
- Ensure the webhook is sending to the correct ngrok URL

## Production Setup

### 1. Add Environment Variables

Add to your production environment (Vercel, Railway, etc.):

```env
LEMONSQUEEZY_API_KEY=your_production_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_production_webhook_secret
SITE_URL=https://yourdomain.com
```

### 2. Create Production Webhook

1. In Lemon Squeezy dashboard, switch to **Live Mode**
2. Go to **Settings → Webhooks**
3. Click **"+ Create Webhook"**
4. Configure:
   - **Callback URL**: `https://yourdomain.com/api/webhooks/lemonsqueezy`
   - **Signing Secret**: Generate a new secret (different from dev)
   - **Events**: Same as development (`order_created`, `order_refunded`)
5. Save the webhook

### 3. Deploy and Test

1. Deploy your application
2. Trigger a test order in live mode (or use Lemon Squeezy's test event feature)
3. Monitor logs in your hosting platform

## Webhook Events Handled

The webhook handler processes these events:

- **`order_created`**: Order is created and paid
  - Upserts order to database
  - Sends fulfillment email with download link (if status is "paid")

- **`order_refunded`**: Order is refunded
  - Updates order status in database

All other events are acknowledged but not processed.

## Troubleshooting

### Webhook Not Receiving Events

1. **Check ngrok is running**: Visit your ngrok URL in a browser - you should see your Next.js app
2. **Verify webhook URL**: Ensure it ends with `/api/webhooks/lemonsqueezy`
3. **Check ngrok logs**: ngrok dashboard shows all requests: `http://127.0.0.1:4040`
4. **Test with GET request**: `curl https://YOUR-NGROK-URL/api/webhooks/lemonsqueezy` should return `{"error":"Method not allowed"}`

### Signature Validation Fails

- Webhook secret mismatch - verify `.env` matches Lemon Squeezy dashboard
- Server not restarted after changing `.env`
- Webhook secret has spaces/newlines - ensure it's on one line

### Fulfillment Email Not Sent

1. Check order status is `"paid"` in webhook payload
2. Verify `playbookSlug` is in order metadata
3. Ensure playbook exists in Sanity with matching slug
4. Check `RESEND_API_KEY` is configured
5. Review server logs for specific error messages

### ngrok Session Expired

Free ngrok URLs expire when ngrok restarts. When this happens:

1. Start ngrok again: `ngrok http 3000`
2. Copy the new URL
3. Update webhook URL in Lemon Squeezy dashboard

**Tip**: ngrok paid plans provide persistent URLs.

## Development Workflow

Recommended workflow for testing payments locally:

1. Start dev server: `npm run dev`
2. Start ngrok: `ngrok http 3000`
3. Update webhook URL in Lemon Squeezy (if ngrok URL changed)
4. Use Lemon Squeezy test mode for purchases
5. Monitor terminal for webhook logs and email confirmations

## Security Notes

- **Never commit** `.env` files with secrets
- Use different webhook secrets for development and production
- Signature verification is enforced in production (when `LEMONSQUEEZY_WEBHOOK_SECRET` is set)
- Webhook route validates payload schema before processing

## Additional Resources

- [Lemon Squeezy Webhooks Docs](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks)
- [ngrok Documentation](https://ngrok.com/docs)
- Webhook handler code: `/app/api/webhooks/lemonsqueezy/route.ts` (removed in favor of Stripe)
- Lemon Squeezy client: `/lib/commerce/lemonsqueezy.ts` (removed in favor of Stripe)
