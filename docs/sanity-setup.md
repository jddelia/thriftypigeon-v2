# Sanity CMS Setup Guide

This guide walks you through setting up and using Sanity CMS for The Thrifty Pigeon.

## Overview

Sanity is the content management system (CMS) and source of truth for:
- **Playbooks**: Product catalog with pricing, descriptions, Stripe price IDs, and file keys
- **Posts**: Blog articles with rich text content and optional playbook CTAs
- **Authors**: Author profiles for blog attribution
- **Tags**: Categorization for posts

## Prerequisites

- Sanity project already created (Project ID: `qdgro20q`)
- Environment variables configured in `.env`:
  ```env
  SANITY_PROJECT_ID=qdgro20q
  SANITY_DATASET=production
  SANITY_API_VERSION=2025-01-01
  SANITY_READ_TOKEN=your_read_token
  ```

## Initial Setup

### 1. Start Sanity Studio

From the project root:

```bash
cd sanity
npm run dev
```

The Sanity Studio will be available at `http://localhost:3333`

### 2. Access the Studio

Open `http://localhost:3333` in your browser. You'll be prompted to sign in with your Sanity account.

### 3. Verify Schema

After signing in, you should see four document types in the sidebar:
- Playbook
- Post
- Author
- Tag

If you still see "No document types", restart the Sanity dev server.

## Creating Your First Playbook

A playbook is required to test the full checkout and webhook flow.

### 1. Create a Product in Stripe

First, set up the product in Stripe:

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/)
2. Ensure you're in **Test mode** (toggle in the left navigation)
3. Navigate to **Products** and click **Add product**
4. Fill in:
   - **Name**: e.g., "Your First Dollar Playbook"
   - **Description**: Brief description
5. Under **Pricing**, create a one-time price (e.g., $29) and save
6. Copy the generated **Price ID** (looks like `price_1234abcd`)

### 2. Upload PDF to Cloudflare R2 (Optional for MVP)

If you have a PDF ready:

1. Log in to Cloudflare Dashboard
2. Navigate to R2 → Your bucket
3. Upload your PDF with a key like: `playbooks/first-dollar-v1.pdf`
4. Copy the file key (the path you used)

### 3. Create the Playbook in Sanity

1. In Sanity Studio, click **"Playbook"** in the sidebar
2. Click **"Create"** (or the "+" button)
3. Fill in the required fields:
   - **Title**: "Your First Dollar Playbook"
   - **Slug**: Click "Generate" to auto-generate from title
   - **Summary**: Short 1-2 sentence description
   - **Price**: `29` (should match Stripe)
   - **Description**: Rich text editor - add detailed "what's inside" content
   - **Stripe Price ID**: Paste the Price ID from step 1 (e.g., `price_1234abcd`)
   - **File Key**: `playbooks/first-dollar-v1.pdf` (if you uploaded a PDF)
   - **FAQ** (optional): Add Q&A pairs
4. Click **"Publish"**

### 4. Verify the Playbook

Test that the playbook is accessible:

```bash
# From project root
curl "http://localhost:3000/api/checkout?slug=your-first-dollar-playbook&email=test@example.com"
```

You should get a response with a checkout URL:

```json
{
  "url": "https://checkout.stripe.com/c/pay/...",
  "expiresAt": "2025-10-07T22:30:00.000Z"
}
```

## Creating Content

### Creating a Blog Post

1. Click **"Post"** in the sidebar
2. Click **"Create"**
3. Fill in:
   - **Title**: Your post title
   - **Slug**: Auto-generate from title
   - **Excerpt**: Short summary for previews
   - **Published At**: Publication date/time
   - **Body**: Your post content (rich text)
   - **Playbook CTA** (optional):
     - **Playbook Slug**: `your-first-dollar-playbook`
     - **Headline**: "Ready to make your first dollar?"
     - **Body**: Short pitch text
   - **Authors**: Reference to author (create one first if needed)
   - **Tags**: Add relevant tags
4. Click **"Publish"**

### Creating Authors

1. Click **"Author"** in the sidebar
2. Click **"Create"**
3. Fill in:
   - **Name**: Author name
   - **Slug**: Auto-generate
   - **Bio**: Short bio
4. Click **"Publish"**

### Creating Tags

1. Click **"Tag"** in the sidebar
2. Click **"Create"**
3. Fill in:
   - **Name**: Tag name (e.g., "Freelancing", "Passive Income")
   - **Slug**: Auto-generate
4. Click **"Publish"**

## Schema Reference

### Playbook Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Playbook title |
| `slug` | Slug | Yes | URL-friendly identifier |
| `summary` | Text | Yes | Short description (1-2 sentences) |
| `price` | Number | Yes | Price in USD |
| `description` | Rich Text | No | Detailed "what's inside" content |
| `stripePriceId` | String | Yes | Stripe price identifier |
| `fileKey` | String | No | R2 storage key for PDF |
| `faq` | Array | No | Array of Q&A objects |

### Post Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Post title |
| `slug` | Slug | Yes | URL-friendly identifier |
| `excerpt` | Text | Yes | Short summary |
| `publishedAt` | DateTime | Yes | Publication date/time |
| `body` | Rich Text | Yes | Post content |
| `playbookCta` | Object | No | Optional playbook CTA |
| `authors` | References | No | Array of author references |
| `tags` | References | No | Array of tag references |

## Common Workflows

### Testing Checkout Flow

1. Create/update a playbook in Sanity
2. Ensure `stripePriceId` matches a test price in Stripe
3. Test the checkout endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/checkout \
     -H "Content-Type: application/json" \
     -d '{"slug": "your-playbook-slug", "email": "test@example.com"}'
   ```
4. Complete the test purchase in Stripe Checkout
5. Verify webhook processing in your server logs

### Updating Playbook Pricing

1. Update price in Stripe dashboard first
2. Update the `price` field in Sanity to match
3. Publish changes in Sanity

The app will use the Stripe price for actual checkout, but displays the Sanity price on the website.

### Adding File Keys for Fulfillment

1. Upload your PDF to Cloudflare R2 with a key like: `playbooks/your-playbook-slug-v1.pdf`
2. Copy the file key (the path)
3. In Sanity, edit your playbook
4. Paste the file key into the **File Key** field
5. Publish

When orders are fulfilled, the webhook handler uses this file key to generate download URLs.

## Deployment

### Protecting Studio in Production

In production, you should protect your Sanity Studio:

**Option 1: Cloudflare Access (Recommended)**
1. Set up Cloudflare Access
2. Create an access policy for `/studio`
3. Require authentication via email or SSO

**Option 2: Environment-based Auth**
Add authentication middleware to your Next.js app for `/studio` routes.

### Sanity API Tokens

Your `.env` includes:
- **`SANITY_READ_TOKEN`**: For reading published content (used by the public site)
- **Write tokens**: Only needed if you build custom integrations

Keep these tokens secure and never commit them to git.

## Troubleshooting

### "No document types" Error

**Cause**: Schema files aren't properly imported or Sanity Studio hasn't restarted.

**Solution**:
1. Check that `/sanity/schemaTypes/index.ts` exports all schemas
2. Restart the Sanity dev server: `cd sanity && npm run dev`
3. Clear browser cache and refresh

### Playbook Not Found in Checkout

**Cause**: Slug mismatch or playbook not published.

**Solution**:
1. Verify the playbook is **published** (not draft) in Sanity
2. Check the slug matches exactly (case-sensitive)
3. Check your `SANITY_READ_TOKEN` has permissions to read published documents

### Webhook Not Finding Playbook Data

**Cause**: `playbookSlug` metadata not being passed to Stripe Checkout or missing from the saved order.

**Solution**:
1. Ensure checkout flow passes `playbookSlug` in metadata (already implemented in `/api/checkout/route.ts`)
2. Check webhook logs for the `playbookSlug` value
3. Verify the playbook exists in Sanity with that slug

## Next Steps

After setting up your Sanity content:

1. **Test the full flow**: Checkout → Webhook → Email fulfillment
2. **Add more playbooks**: Create additional products in Stripe and Sanity
3. **Create blog posts**: Build out your content library
4. **Set up preview mode**: Enable draft preview for editorial workflow (see Next.js docs)

## Additional Resources

- [Sanity Documentation](https://www.sanity.io/docs)
- [Sanity Schema Types](https://www.sanity.io/docs/schema-types)
- [Portable Text](https://www.sanity.io/docs/presenting-block-text)
- Project Sanity Studio: `http://localhost:3333`
- Sanity Management: `https://www.sanity.io/manage/personal/project/qdgro20q`
