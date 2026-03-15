"use client";

import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    // Keep the error visible in console for debugging while showing a user-safe fallback.
    console.error("App segment error:", error);
  }, [error]);

  return (
    <main className="hero-grid min-h-screen bg-gh-bg px-6 py-12 md:px-16">
      <section className="glass-card mx-auto max-w-xl rounded-2xl p-6 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-gh-green">CODEAX</p>
        <h1 className="mt-2 text-2xl font-semibold text-gh-heading">Something went wrong</h1>
        <p className="mt-2 text-sm text-gh-text">
          The page failed to load, but the app is still running. Try reloading this view.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 rounded-xl bg-gh-green px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
