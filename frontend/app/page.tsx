import Link from "next/link";

export default function HomePage() {
  return (
    <main className="hero-grid min-h-screen px-6 py-10 md:px-16 md:py-16">
      <section className="page-shell glass-card pulse-glow rounded-3xl p-8 md:p-12">
        <p className="text-gh-green text-sm font-semibold tracking-[0.22em]">CODEAX AI</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-gh-heading md:text-6xl">
          Autonomous GitHub review, security scanning, and test guidance.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gh-text">
          Analyze pull requests, identify risks, and surface actionable improvements from a single dashboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link className="rounded-xl bg-gh-green px-5 py-3 font-semibold text-white transition hover:brightness-110" href="/dashboard">
            Open Dashboard
          </Link>
          <a className="rounded-xl border border-gh-border bg-gh-bg/60 px-5 py-3 font-semibold transition hover:border-gh-green" href="http://localhost:8000/docs">
            API Docs
          </a>
        </div>
      </section>
      <section className="page-shell mt-8 grid gap-4 md:grid-cols-3">
        <article className="glass-card hover-lift rounded-2xl p-5 float-soft">
          <h2 className="text-base font-semibold text-gh-heading">Code Review Agent</h2>
          <p className="mt-2 text-sm text-gh-text">Highlights quality risks and readability improvements in changed files.</p>
        </article>
        <article className="glass-card hover-lift rounded-2xl p-5 float-soft" style={{ animationDelay: "0.25s" }}>
          <h2 className="text-base font-semibold text-gh-heading">Security Agent</h2>
          <p className="mt-2 text-sm text-gh-text">Flags exposed secrets and insecure patterns before merge.</p>
        </article>
        <article className="glass-card hover-lift rounded-2xl p-5 float-soft" style={{ animationDelay: "0.5s" }}>
          <h2 className="text-base font-semibold text-gh-heading">Test Agent</h2>
          <p className="mt-2 text-sm text-gh-text">Suggests test cases for newly introduced logic paths.</p>
        </article>
      </section>
      <section className="page-shell glass-card mt-8 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gh-heading">Workflow</h2>
        <p className="mt-2 text-sm text-gh-text">
          Webhook event to coordinator agent to specialized agents to aggregated output to dashboard and PR summary.
        </p>
      </section>
      <section className="page-shell glass-card mt-8 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gh-heading">Pricing</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-gh-border bg-gh-bg/60 p-4 text-sm">Starter - 3 repos - Free</div>
          <div className="rounded-xl border border-gh-green bg-gh-bg/60 p-4 text-sm">Pro - Unlimited repos - $29/month</div>
          <div className="rounded-xl border border-gh-border bg-gh-bg/60 p-4 text-sm">Enterprise - Custom workflows</div>
        </div>
      </section>
    </main>
  );
}
