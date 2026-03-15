"use client";

export default function GlobalError() {
  return (
    <html lang="en">
      <body className="hero-grid min-h-screen bg-gh-bg px-6 py-12 md:px-16">
        <section className="glass-card mx-auto max-w-xl rounded-2xl p-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-gh-green">CODEAX</p>
          <h1 className="mt-2 text-2xl font-semibold text-gh-heading">Unexpected app failure</h1>
          <p className="mt-2 text-sm text-gh-text">
            A critical error occurred. Please refresh the page. If the issue persists, restart the frontend server.
          </p>
          <a
            href="/"
            className="mt-5 inline-block rounded-xl bg-gh-green px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Go Home
          </a>
        </section>
      </body>
    </html>
  );
}
