import { SectionCard } from "@/components/common/section-card";
import { MetricCard } from "@/components/ui/metric-card";
import { fetchJson } from "@/lib/api";
import { dashboardMetrics, pullRequests, repositories } from "@/lib/data";

const OWNER = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_OWNER || "nikhilkumarpanigrahi";
const REPO = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_REPO || "codeax";

type RepoSummary = {
  repository: string;
  analysis_reports: number;
  overall_score: number;
  high_severity_findings: number;
  generated_tests: number;
  recommendation: string;
};

type ApiRepository = {
  full_name: string;
  health: { overall: number };
};

type ApiPullRequest = {
  number: number;
  title: string;
  status: string;
};

export default async function DashboardPage() {
  let metrics = dashboardMetrics;
  let topRepositories = repositories;
  let recentPullRequests = pullRequests;
  let recommendation = "No analysis report found yet.";
  let dataSource = "Fallback demo data";

  try {
    const [summary, repos, prs] = await Promise.all([
      fetchJson<RepoSummary>(`/api/analysis/${OWNER}/${REPO}/summary`),
      fetchJson<ApiRepository[]>("/api/repositories/"),
      fetchJson<ApiPullRequest[]>(`/api/pull-requests/${OWNER}/${REPO}`),
    ]);

    recommendation = summary.recommendation;
    metrics = [
      { label: "Connected Repositories", value: String(repos.length), delta: "Live from API", trend: "up" },
      { label: "PRs Analyzed", value: String(summary.analysis_reports), delta: "Stored analysis reports", trend: "up" },
      { label: "Security Alerts", value: String(summary.high_severity_findings), delta: "Critical/high findings", trend: "up" },
      { label: "Estimated Coverage", value: `${summary.overall_score}%`, delta: "Overall health score", trend: "up" },
    ];
    dataSource = "Live backend API";

    if (repos.length > 0) {
      topRepositories = repos.slice(0, 3).map((repo) => ({
        fullName: repo.full_name,
        language: "Unknown",
        stars: 0,
        health: repo.health.overall,
      }));
    }

    if (prs.length > 0) {
      recentPullRequests = prs.slice(0, 3).map((pr) => ({
        number: pr.number,
        title: pr.title,
        author: "github",
        status: pr.status,
      }));
    }
  } catch {
    // Keep static fallback data if API is unavailable.
  }

  return (
    <div className="space-y-6">
      <div className="anim-fade-up">
        <h2 className="text-3xl font-semibold text-gh-heading">Overview</h2>
        <p className="text-sm text-gh-text">Live repository insights and AI analysis summaries.</p>
        <p className="text-xs text-gh-text/80">Data source: {dataSource}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 anim-fade-up anim-delay-1">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} delta={metric.delta} trend={metric.trend} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 anim-fade-up anim-delay-2">
        <SectionCard title="Top Repositories">
          <ul className="space-y-2">
            {topRepositories.map((repo) => (
              <li key={repo.fullName} className="hover-lift rounded-xl border border-gh-border bg-gh-bg/70 px-3 py-2 text-sm">
                {repo.fullName} - health {repo.health}%
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Recent Pull Requests">
          <ul className="space-y-2">
            {recentPullRequests.map((pr) => (
              <li key={pr.number} className="hover-lift rounded-xl border border-gh-border bg-gh-bg/70 px-3 py-2 text-sm">
                #{pr.number} {pr.title} ({pr.status})
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
      <SectionCard title="Coordinator Recommendation">
        <p className="text-sm">{recommendation}</p>
      </SectionCard>
    </div>
  );
}
