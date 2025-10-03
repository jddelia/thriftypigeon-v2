import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/90 py-8 text-sm">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} The Thrifty Pigeon. All rights reserved.</p>
        <nav aria-label="Legal">
          <ul className="flex flex-wrap items-center gap-3">
            <li>
              <Link className="hover:underline" href="/privacy">
                Privacy
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/terms">
                Terms
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/refunds">
                Refunds
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/disclosures">
                Disclosures
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
