import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PortableText } from "@/components/portable-text";
import { getPost } from "@/lib/sanity/queries";

interface PostPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Post not found" };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
    },
  } satisfies Metadata;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="mb-12 space-y-4">
        <p className="text-sm text-slate-500">{post.estimatedReadingTime}</p>
        <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">{post.title}</h1>
        <p className="text-lg text-slate-600">{post.excerpt}</p>
      </header>
      <PortableText value={post.body} />
      {post.playbookCta ? (
        <aside className="mt-16 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">{post.playbookCta.headline}</h2>
          <p className="mt-2 text-slate-600">{post.playbookCta.body}</p>
        </aside>
      ) : null}
    </article>
  );
}
