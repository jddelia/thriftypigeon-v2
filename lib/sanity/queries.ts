import groq from "groq";

import type { HomeContent, PlaybookContent, PostContent } from "./types";
import { getSanityClient } from "./client";

const homeQuery = groq`{
  "tagline": coalesce(settings.tagline, "Tactical guidance for saving and making money"),
  "hero": {
    "title": coalesce(settings.hero.title, "Copy a proven playbook tonight"),
    "subtitle": coalesce(settings.hero.subtitle, "Learn how real operators compound savings and income without the fluff."),
    "primaryCta": coalesce(settings.hero.primaryCta, {
      "href": "/subscribe",
      "label": "Get the newsletter"
    }),
    "secondaryCta": coalesce(settings.hero.secondaryCta, {
      "href": "/playbooks",
      "label": "Browse playbooks"
    })
  },
  "featuredPlaybook": select(
    defined(settings.featuredPlaybook->slug.current) => {
      "title": settings.featuredPlaybook->title,
      "summary": settings.featuredPlaybook->summary,
      "slug": settings.featuredPlaybook->slug.current,
      "checkoutUrl": settings.featuredPlaybook->providerData.checkoutUrl
    },
    {
      "title": "Emergency Fund Fast Track",
      "summary": "Build a resilient runway in 30 days with automations that stick.",
      "slug": "emergency-fund-fast-track",
      "checkoutUrl": "#"
    }
  ),
  "posts": *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...6] {
    "slug": slug.current,
    "title": title,
    "excerpt": coalesce(description, pt::text(body)[0...160]),
    "readingTime": coalesce(readingTime, "5 min read")
  },
  "newsletter": {
    "copy": coalesce(settings.newsletterCopy, "One actionable money move in your inbox every Tuesday night.")
  }
}`;

const postQuery = groq`*[_type == "post" && slug.current == $slug][0] {
  "title": title,
  "excerpt": coalesce(description, pt::text(body)[0...200]),
  "slug": slug.current,
  "body": body,
  "publishedAt": coalesce(publishedAt, _createdAt),
  "estimatedReadingTime": coalesce(readingTime, "7 min read"),
  "playbookCta": select(
    defined(playbookCta) => {
      "playbookSlug": playbookCta.playbook->slug.current,
      "headline": playbookCta.headline,
      "body": playbookCta.body
    }
  )
}`;

const playbookQuery = groq`*[_type == "playbook" && slug.current == $slug][0] {
  "title": title,
  "slug": slug.current,
  "summary": summary,
  "price": price,
  "description": description,
  "faq": faq[]{
    "question": question,
    "answer": answer
  },
  "stripePriceId": providerData.priceId,
  "fileKey": fileKey
}`;

const fallbackHomeContent: HomeContent = {
  tagline: "Tactical guidance for saving and making money",
  hero: {
    title: "Copy a proven playbook tonight",
    subtitle: "Learn how real operators compound savings and income without the fluff.",
    primaryCta: { href: "/subscribe", label: "Get the newsletter" },
    secondaryCta: { href: "/playbooks", label: "Browse playbooks" },
  },
  featuredPlaybook: {
    title: "Emergency Fund Fast Track",
    summary: "Build a resilient runway in 30 days with automations that stick.",
    slug: "emergency-fund-fast-track",
    checkoutUrl: "#",
  },
  posts: [
    {
      slug: "start-a-rainy-day-fund",
      title: "Start a rainy day fund that actually lasts",
      excerpt: "Automate your cash cushion in under an hour with the exact workflows we use.",
      readingTime: "6 min read",
    },
    {
      slug: "negotiate-your-bills",
      title: "Negotiate bills like a pro (scripts included)",
      excerpt: "Save $1,200 per year by turning three uncomfortable calls into a checklist.",
      readingTime: "8 min read",
    },
    {
      slug: "optimize-your-solo-business",
      title: "Optimize your solo business systems",
      excerpt: "Cut admin time in half and reinvest the hours into high-leverage work.",
      readingTime: "9 min read",
    },
  ],
  newsletter: {
    copy: "One actionable money move in your inbox every Tuesday night.",
  },
};

export async function getHomeContent(): Promise<HomeContent> {
  const isSanityConfigured = Boolean(process.env.SANITY_PROJECT_ID && process.env.SANITY_DATASET);

  if (!isSanityConfigured) {
    return fallbackHomeContent;
  }

  try {
    const client = getSanityClient();
    const data = await client.fetch<HomeContent>(homeQuery);
    return {
      ...fallbackHomeContent,
      ...data,
      hero: {
        ...fallbackHomeContent.hero,
        ...data?.hero,
        primaryCta: {
          ...fallbackHomeContent.hero.primaryCta,
          ...data?.hero?.primaryCta,
        },
        secondaryCta: {
          ...fallbackHomeContent.hero.secondaryCta,
          ...data?.hero?.secondaryCta,
        },
      },
      featuredPlaybook: {
        ...fallbackHomeContent.featuredPlaybook,
        ...data?.featuredPlaybook,
      },
      posts: data?.posts?.length ? data.posts : fallbackHomeContent.posts,
      newsletter: {
        ...fallbackHomeContent.newsletter,
        ...data?.newsletter,
      },
    } satisfies HomeContent;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    console.warn("Using fallback home content due to Sanity error", error);
    return fallbackHomeContent;
  }
}

export async function getPost(slug: string): Promise<PostContent | null> {
  if (!slug) {
    throw new Error("getPost requires a slug");
  }

  if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_DATASET) {
    return null;
  }

  try {
    const client = getSanityClient();
    const post = await client.fetch<PostContent | null>(postQuery, { slug });
    return post;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    console.warn(`Failed to load post ${slug}`, error);
    return null;
  }
}

export async function getPlaybook(slug: string): Promise<PlaybookContent | null> {
  if (!slug) {
    throw new Error("getPlaybook requires a slug");
  }

  if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_DATASET) {
    return null;
  }

  try {
    const client = getSanityClient();
    const playbook = await client.fetch<PlaybookContent | null>(playbookQuery, { slug });
    return playbook;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    console.warn(`Failed to load playbook ${slug}`, error);
    return null;
  }
}
