import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/posts", label: "Articles" },
  { href: "/playbooks", label: "Playbooks" },
  { href: "/subscribe", label: "Newsletter" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Link className="font-semibold" href="/">
          The Thrifty Pigeon
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-4 text-sm font-medium">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link className="hover:underline" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
