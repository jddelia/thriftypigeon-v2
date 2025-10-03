import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: {
    default: "The Thrifty Pigeon",
    template: "%s | The Thrifty Pigeon",
  },
  description:
    "Actionable playbooks and editorial guidance for saving and making money.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
