import { SectionCard } from "@/components/common/section-card";
import { fetchJson } from "@/lib/api";

type RepositoryHealth = {
  code_quality: number;
  security: number;
  tests: number;
  overall: number;
};

type RepositoryResponse = {
  full_name: string;
  language: string | null;
  stars: number;
  health: RepositoryHealth;
};

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Stable";
  if (score >= 60) return "Needs Attention";
  return "High Risk";
}

function scoreTone(score: number): string {
  if (score >= 90) return "text-emerald-300";
  if (score >= 80) return "text-green-300";
  if (score >= 70) return "text-sky-300";
  if (score >= 60) return "text-amber-300";
  return "text-rose-300";
}

function barTone(score: number): string {
  if (score >= 90) return "from-emerald-400 to-green-300";
  if (score >= 80) return "from-green-400 to-cyan-300";
  if (score >= 70) return "from-sky-400 to-blue-300";
  if (score >= 60) return "from-amber-400 to-orange-300";
  return "from-rose-400 to-red-300";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-gh-text/85">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-gh-bg/80">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${barTone(value)}`}
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export default async function HealthPage() {
  let repos: RepositoryResponse[] = [];

  try {
    repos = await fetchJson<RepositoryResponse[]>("/api/repositories/");
  } catch {
    repos = [];
  }

  const sorted = [...repos].sort((a, b) => b.health.overall - a.health.overall);
  const averageOverall = sorted.length > 0 ? Math.round(sorted.reduce((sum, item) => sum + item.health.overall, 0) / sorted.length) : 0;

  return (
    <div className="space-y-4">
      <SectionCard title="Repository Health Overview">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gh-border bg-gh-bg/60 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gh-text/75">Repositories Scanned</p>
            <p className="mt-1 text-2xl font-semibold text-gh-heading">{sorted.length}</p>
          </div>
          <div className="rounded-xl border border-gh-border bg-gh-bg/60 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gh-text/75">Average Overall Health</p>
            <p className={`mt-1 text-2xl font-semibold ${scoreTone(averageOverall)}`}>{averageOverall}%</p>
          </div>
          <div className="rounded-xl border border-gh-border bg-gh-bg/60 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gh-text/75">Scoring Model</p>
            <p className="mt-1 text-sm text-gh-text">Code quality, security, tests, and repository activity.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="How Health Score Is Calculated">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Overall health blends issue load, recent activity, stars, language signal, and archive state.</li>
          <li>Code quality score reflects maintainability and issue pressure.</li>
          <li>Security score is adjusted by risk indicators and issue density.</li>
          <li>Test score estimates confidence level and validation coverage maturity.</li>
        </ul>
      </SectionCard>

      <SectionCard title="Repository Health Details">
        {sorted.length === 0 ? (
          <p className="text-sm text-gh-text">No repository health data available right now. Ensure backend API access is active.</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((repo) => (
              <li key={repo.full_name} className="rounded-xl border border-gh-border bg-gh-bg/65 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gh-heading">{repo.full_name}</p>
                    <p className="text-xs text-gh-text/75">{repo.language || "Unknown"} · {repo.stars} stars</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${scoreTone(repo.health.overall)}`}>{repo.health.overall}%</p>
                    <p className={`text-xs ${scoreTone(repo.health.overall)}`}>{scoreLabel(repo.health.overall)}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <ScoreBar label="Code Quality" value={repo.health.code_quality} />
                  <ScoreBar label="Security" value={repo.health.security} />
                  <ScoreBar label="Tests" value={repo.health.tests} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
