import Link from "next/link";

import { getHomeContent } from "@/lib/sanity/queries";

export const metadata = {
  title: "Playbooks",
  description: "Premium PDF playbooks with proven money systems.",
};

export default async function PlaybooksIndexPage() {
  const data = await getHomeContent();
  const featured = data.featuredPlaybook;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Playbooks</h1>
      <p className="mt-2 text-slate-600">
        Deep-dive PDFs that remove the guesswork. Each blueprint ships with templates and scripts.
      </p>
      <div className="mt-10 space-y-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Featured</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{featured.title}</h2>
          <p className="mt-2 text-slate-600">{featured.summary}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              href={`/playbooks/${featured.slug}`}
            >
              View details
            </Link>
            <Link
              className="rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              href={featured.checkoutUrl}
            >
              Buy now
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
