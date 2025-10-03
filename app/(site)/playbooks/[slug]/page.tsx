import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PortableText } from "@/components/portable-text";
import { getPlaybook } from "@/lib/sanity/queries";

interface PlaybookPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PlaybookPageProps): Promise<Metadata> {
  const { slug } = params;
  const playbook = await getPlaybook(slug);

  if (!playbook) {
    return { title: "Playbook not found" };
  }

  return {
    title: `${playbook.title} Playbook`,
    description: playbook.summary,
  } satisfies Metadata;
}

export default async function PlaybookPage({ params }: PlaybookPageProps) {
  const { slug } = params;
  const playbook = await getPlaybook(slug);

  if (!playbook) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-12">
      <header className="mb-12 space-y-4">
        <h1 className="text-4xl font-semibold text-slate-900">{playbook.title}</h1>
        <p className="text-lg text-slate-600">{playbook.summary}</p>
        <p className="text-2xl font-semibold text-slate-900">${playbook.price.toFixed(2)}</p>
        <Link
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          href={`/api/checkout?playbook=${playbook.slug}`}
        >
          Buy the playbook
        </Link>
      </header>

      <section className="prose prose-slate max-w-none">
        <PortableText value={playbook.description} />
      </section>

      {playbook.faq?.length ? (
        <section className="mt-16 space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900">Frequently asked questions</h2>
          <ul className="space-y-4">
              {playbook.faq.map((item, index) => (
                <li className="rounded-2xl border border-slate-200 bg-white p-6" key={index}>
                <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
                <PortableText value={item.answer} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
