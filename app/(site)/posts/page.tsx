import Link from "next/link";

import { getHomeContent } from "@/lib/sanity/queries";

export const metadata = {
  title: "Latest posts",
  description: "Actionable ways to save and earn more with proven playbooks.",
};

export default async function PostsIndexPage() {
  const data = await getHomeContent();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Latest Posts</h1>
      <p className="mt-2 text-slate-600">Field-tested tactics for stretching savings and growing income.</p>
      <div className="mt-10 space-y-6">
        {data.posts.map((post) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={post.slug}>
            <p className="text-xs uppercase tracking-wide text-slate-500">{post.readingTime}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="mt-2 text-slate-600">{post.excerpt}</p>
            <Link className="mt-4 inline-flex text-sm font-semibold text-slate-900" href={`/posts/${post.slug}`}>
              Read the playbook
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
