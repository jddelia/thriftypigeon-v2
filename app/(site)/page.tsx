import Link from "next/link";

import { getHomeContent } from "@/lib/sanity/queries";

export const revalidate = 60;

export default async function HomePage() {
  const data = await getHomeContent();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
      <section className="mb-16 space-y-4">
        <p className="text-sm uppercase tracking-wide text-slate-500">{data.tagline}</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          {data.hero.title}
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">{data.hero.subtitle}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            href={data.hero.primaryCta.href}
          >
            {data.hero.primaryCta.label}
          </Link>
          <Link
            className="rounded-full border border-slate-900 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            href={data.hero.secondaryCta.href}
          >
            {data.hero.secondaryCta.label}
          </Link>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold text-slate-900">Featured Playbook</h2>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">{data.featuredPlaybook.title}</h3>
          <p className="mt-2 text-slate-600">{data.featuredPlaybook.summary}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              href={`/playbooks/${data.featuredPlaybook.slug}`}
            >
              Explore Playbook
            </Link>
            <Link
              className="rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              href={data.featuredPlaybook.checkoutUrl}
            >
              Buy Now
            </Link>
          </div>
        </article>
      </section>

      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Latest Posts</h2>
          <Link className="text-sm font-semibold text-slate-600 hover:text-slate-900" href="/posts">
            View all
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
            {data.posts.map((post) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={post.slug}>
              <p className="text-xs uppercase tracking-wide text-slate-500">{post.readingTime}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              </h3>
              <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Stay ahead with the newsletter</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          {data.newsletter.copy}
        </p>
        <form className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            aria-label="Email"
            className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm"
            disabled
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
          <button
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white opacity-60"
            disabled
            type="submit"
          >
            Coming soon
          </button>
        </form>
      </section>
    </div>
  );
}
