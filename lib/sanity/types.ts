export interface SanityLink {
  href: string;
  label: string;
}

export interface HomeContent {
  tagline: string;
  hero: {
    title: string;
    subtitle: string;
    primaryCta: SanityLink;
    secondaryCta: SanityLink;
  };
  featuredPlaybook: {
    title: string;
    summary: string;
    slug: string;
    checkoutUrl: string;
  };
  posts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    readingTime: string;
  }>;
  newsletter: {
    copy: string;
  };
}

export interface PortableTextBlock {
  _type: string;
  children?: Array<{ text: string }>;
  [key: string]: unknown;
}

export interface PostContent {
  title: string;
  excerpt: string;
  slug: string;
  body: PortableTextBlock[];
  publishedAt: string;
  estimatedReadingTime: string;
  playbookCta?: {
    playbookSlug: string;
    headline: string;
    body: string;
  };
}

export interface PlaybookContent {
  title: string;
  slug: string;
  summary: string;
  price: number;
  description: PortableTextBlock[];
  faq: Array<{
    question: string;
    answer: PortableTextBlock[];
  }>;
  lemonsqueezyVariantId: string;
  fileKey?: string | null;
}
