import { SectionCard } from "@/components/common/section-card";
import { fetchJson } from "@/lib/api";
import { repositories } from "@/lib/data";

type RepositoryResponse = {
  full_name: string;
  language: string | null;
  stars: number;
  health: {
    overall: number;
  };
};

type RepositoryInsightResponse = {
  repository: string;
  vulnerabilities: number;
  code_smells: number;
  test_coverage: number;
};

type HealthSnapshot = {
  timestamp: string;
  code_quality: number;
  security: number;
  tests: number;
  technical_debt: number;
  overall: number;
};

type HealthHistoryResponse = {
  repository: string;
  history: HealthSnapshot[];
};

type RepositoryTracking = {
  fullName: string;
  vulnerabilities: number | null;
  codeSmells: number | null;
  coverage: number | null;
  historyPoints: number;
  latestOverall: number | null;
  trendDelta: number | null;
};

type RepositoryAnalysisResponse = {
  generated_at: string;
  findings: Array<{ severity: string; category: string }>;
  generated_tests: string[];
  documentation_recommendations: string[];
  dependency_risks: string[];
  agent_outputs: Array<{ name: string; status: string }>;
};

type RepositoryKnowledgeMap = {
  fullName: string;
  lastAnalyzed: string | null;
  contextSignals: string[];
  routedAgents: string[];
};

function formatTrend(delta: number | null): string {
  if (delta === null) return "No trend yet";
  if (delta > 0) return `+${delta} improving`;
  if (delta < 0) return `${delta} declining`;
  return "0 stable";
}

function trendTone(delta: number | null): string {
  if (delta === null) return "text-gh-text/80";
  if (delta > 0) return "text-emerald-300";
  if (delta < 0) return "text-amber-300";
  return "text-sky-300";
}

function prettyAgentName(name: string): string {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAnalyzedTime(value: string | null): string {
  if (!value) return "No analysis yet";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No analysis yet";
  return `Last analyzed ${parsed.toLocaleDateString()} ${parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default async function RepositoriesPage() {
  let items = repositories;
  let tracking: RepositoryTracking[] = [];
  let knowledgeMap: RepositoryKnowledgeMap[] = [];

  try {
    const liveRepositories = await fetchJson<RepositoryResponse[]>("/api/repositories/");
    if (liveRepositories.length > 0) {
      items = liveRepositories.map((repo) => ({
        fullName: repo.full_name,
        language: repo.language || "Unknown",
        stars: repo.stars,
        health: repo.health.overall,
      }));

      tracking = await Promise.all(
        liveRepositories.map(async (repo) => {
          const [owner, repoName] = repo.full_name.split("/");

          if (!owner || !repoName) {
            return {
              fullName: repo.full_name,
              vulnerabilities: null,
              codeSmells: null,
              coverage: null,
              historyPoints: 0,
              latestOverall: null,
              trendDelta: null,
            } satisfies RepositoryTracking;
          }

          try {
            const [insights, historyPayload] = await Promise.all([
              fetchJson<RepositoryInsightResponse>(`/api/repositories/${owner}/${repoName}/insights`),
              fetchJson<HealthHistoryResponse>(`/api/repositories/${owner}/${repoName}/health-history`),
            ]);

            const history = historyPayload.history;
            const latest = history.length > 0 ? history[history.length - 1] : null;
            const baseline = history.length > 1 ? history[0] : latest;
            const delta = latest && baseline ? latest.overall - baseline.overall : null;

            return {
              fullName: repo.full_name,
              vulnerabilities: insights.vulnerabilities,
              codeSmells: insights.code_smells,
              coverage: insights.test_coverage,
              historyPoints: history.length,
              latestOverall: latest?.overall ?? repo.health.overall,
              trendDelta: delta,
            } satisfies RepositoryTracking;
          } catch {
            return {
              fullName: repo.full_name,
              vulnerabilities: null,
              codeSmells: null,
              coverage: null,
              historyPoints: 0,
              latestOverall: repo.health.overall,
              trendDelta: null,
            } satisfies RepositoryTracking;
          }
        }),
      );

      const mapCandidates = liveRepositories.slice(0, 5);
      knowledgeMap = await Promise.all(
        mapCandidates.map(async (repo) => {
          const [owner, repoName] = repo.full_name.split("/");
          if (!owner || !repoName) {
            return {
              fullName: repo.full_name,
              lastAnalyzed: null,
              contextSignals: ["Repository connected"],
              routedAgents: ["Code Review"],
            } satisfies RepositoryKnowledgeMap;
          }

          try {
            const analyses = await fetchJson<RepositoryAnalysisResponse[]>(`/api/analysis/${owner}/${repoName}`);
            const latest = analyses[0];
            if (!latest) {
              return {
                fullName: repo.full_name,
                lastAnalyzed: null,
                contextSignals: ["Awaiting first PR analysis"],
                routedAgents: ["Code Review"],
              } satisfies RepositoryKnowledgeMap;
            }

            const criticalHigh = latest.findings.filter((item) => item.severity === "critical" || item.severity === "high").length;
            const uniqueCategories = Array.from(new Set(latest.findings.map((item) => item.category))).slice(0, 2);

            const contextSignals = [
              `${criticalHigh} high-risk findings`,
              `${latest.generated_tests.length} test ideas`,
              `${latest.dependency_risks.length} dependency risks`,
              ...uniqueCategories.map((item) => `${item} hotspots`),
            ]
              .filter((item) => !item.startsWith("0 "))
              .slice(0, 4);

            const routedAgents = latest.agent_outputs
              .filter((item) => item.status === "completed")
              .map((item) => prettyAgentName(item.name));

            return {
              fullName: repo.full_name,
              lastAnalyzed: latest.generated_at,
              contextSignals: contextSignals.length > 0 ? contextSignals : ["Low-risk repository profile"],
              routedAgents: routedAgents.length > 0 ? routedAgents : ["Code Review"],
            } satisfies RepositoryKnowledgeMap;
          } catch {
            return {
              fullName: repo.full_name,
              lastAnalyzed: null,
              contextSignals: ["Analysis service unavailable"],
              routedAgents: ["Code Review"],
            } satisfies RepositoryKnowledgeMap;
          }
        }),
      );
    }
  } catch {
    // Fall back to static data if backend is unavailable.
  }

  if (tracking.length === 0) {
    tracking = items.map((repo) => ({
      fullName: repo.fullName,
      vulnerabilities: null,
      codeSmells: null,
      coverage: null,
      historyPoints: 0,
      latestOverall: repo.health,
      trendDelta: null,
    }));
  }

  if (knowledgeMap.length === 0) {
    knowledgeMap = items.slice(0, 5).map((repo) => ({
      fullName: repo.fullName,
      lastAnalyzed: null,
      contextSignals: ["Awaiting first PR analysis"],
      routedAgents: ["Code Review"],
    }));
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Repositories">
        <ul className="space-y-3">
          {items.map((repo) => (
            <li key={repo.fullName} className="hover-lift rounded-xl border border-gh-border bg-gh-bg/70 px-4 py-3">
              <p className="font-medium text-gh-heading">{repo.fullName}</p>
              <p className="text-sm">{repo.language} · {repo.stars} stars · Health {repo.health}%</p>
            </li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Repository Metrics Tracking">
        <ul className="space-y-3">
          {tracking.map((repo) => (
            <li key={repo.fullName} className="rounded-xl border border-gh-border bg-gh-bg/70 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-gh-heading">{repo.fullName}</p>
                <p className={`text-xs font-semibold ${trendTone(repo.trendDelta)}`}>{formatTrend(repo.trendDelta)}</p>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-gh-text sm:grid-cols-2 lg:grid-cols-4">
                <p className="rounded-md bg-gh-bg/40 px-2 py-1">Latest Health: {repo.latestOverall ?? "n/a"}%</p>
                <p className="rounded-md bg-gh-bg/40 px-2 py-1">Vulnerabilities: {repo.vulnerabilities ?? "n/a"}</p>
                <p className="rounded-md bg-gh-bg/40 px-2 py-1">Code Smells: {repo.codeSmells ?? "n/a"}</p>
                <p className="rounded-md bg-gh-bg/40 px-2 py-1">Coverage: {repo.coverage ?? "n/a"}%</p>
              </div>
              <p className="mt-2 text-xs text-gh-text/80">Health history points: {repo.historyPoints}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="AI Repository Knowledge Map">
        <div className="space-y-3">
          {knowledgeMap.map((repo) => (
            <article key={repo.fullName} className="rounded-xl border border-gh-border bg-gh-bg/65 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-gh-heading">{repo.fullName}</p>
                <p className="text-xs text-gh-text/80">{formatAnalyzedTime(repo.lastAnalyzed)}</p>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {repo.contextSignals.map((signal) => (
                  <span key={signal} className="rounded-full border border-gh-border/70 bg-gh-bg/50 px-2 py-1 text-[11px] text-gh-text/90">
                    {signal}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gh-text">
                <span className="rounded-md bg-gh-bg/40 px-2 py-1">Coordinator</span>
                <span className="text-gh-text/70">→</span>
                {repo.routedAgents.map((agent, index) => (
                  <span key={`${repo.fullName}-${agent}-${index}`} className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-200">
                    {agent}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
