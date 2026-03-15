export default function DashboardLoading() {
  return (
    <div className="min-h-[50vh] anim-fade-in">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gh-border/70 bg-gh-card/70 p-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-gh-green">CODEAX</p>
        <h2 className="mt-2 text-2xl font-semibold text-gh-heading">Loading dashboard</h2>
        <p className="mt-1 text-sm text-gh-text">Fetching repository insights and analysis data.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-xl border border-gh-border bg-gh-bg/60" />
          <div className="h-20 animate-pulse rounded-xl border border-gh-border bg-gh-bg/60" />
          <div className="h-20 animate-pulse rounded-xl border border-gh-border bg-gh-bg/60" />
          <div className="h-20 animate-pulse rounded-xl border border-gh-border bg-gh-bg/60" />
        </div>
      </div>
    </div>
  );
}
