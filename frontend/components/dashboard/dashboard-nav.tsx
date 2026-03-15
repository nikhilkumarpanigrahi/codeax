"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/repositories", label: "Repositories" },
  { href: "/dashboard/health", label: "Health" },
  { href: "/dashboard/pull-requests", label: "Pull Requests" },
  { href: "/dashboard/security", label: "Security" },
  { href: "/dashboard/tests", label: "Tests" },
  { href: "/dashboard/chatbot", label: "Chatbot" },
  { href: "/dashboard/settings", label: "Settings" }
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-gh-border/80 bg-gh-card/80 px-4 py-4 backdrop-blur-sm md:h-screen md:w-72 md:border-b-0 md:border-r md:px-5 md:py-6">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 font-semibold text-gh-heading">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gh-green text-sm text-white shadow-[0_0_20px_rgba(42,209,120,0.45)]">CX</span>
        Codeax
      </Link>
      <nav className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-1">
        {navItems.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative overflow-hidden rounded-xl border px-3 py-2 text-sm transition ${
              pathname === item.href
                ? "border-gh-green/60 bg-gh-green/10 text-gh-heading"
                : "border-transparent text-gh-text hover:border-gh-border hover:bg-gh-bg/70"
            } ${index > 0 ? "anim-fade-up anim-delay-1" : "anim-fade-up"}`}
          >
            {pathname === item.href ? (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-gh-green/10 to-sky-400/10"
                transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
              />
            ) : null}
            <span className="relative z-10">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
