"use client";

import { signOut } from "next-auth/react";

export function DashboardHeader() {
  return (
    <header className="border-b border-gh-border/80 bg-gh-card/80 px-6 py-4 backdrop-blur-sm anim-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-gh-heading">Codeax Dashboard</h1>
          <p className="text-sm text-gh-text">Track repository health, PR analysis, and security posture in one place.</p>
        </div>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/login" })}
          className="rounded-xl border border-gh-border bg-gh-bg/60 px-3 py-2 text-sm font-medium text-gh-text transition hover:border-gh-green hover:text-gh-heading"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
