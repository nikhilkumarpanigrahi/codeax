import { SectionCard } from "@/components/common/section-card";
import { fetchJson } from "@/lib/api";

const OWNER = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_OWNER || "nikhilkumarpanigrahi";
const REPO = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_REPO || "codeax";

type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

type SummaryResponse = {
  analysis_reports: number;
  high_severity_findings: number;
  generated_tests: number;
};

export default async function SettingsPage() {
  let backendStatus = "unknown";
  let version = "n/a";
  let analysisReports = 0;
  let highSeverity = 0;
  let generatedTests = 0;

  try {
    const [health, summary] = await Promise.all([
      fetchJson<HealthResponse>("/health"),
      fetchJson<SummaryResponse>(`/api/analysis/${OWNER}/${REPO}/summary`),
    ]);
    backendStatus = health.status;
    version = health.version;
    analysisReports = summary.analysis_reports;
    highSeverity = summary.high_severity_findings;
    generatedTests = summary.generated_tests;
  } catch {
    // Leave defaults if backend is unavailable.
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Settings">
        <p className="text-sm">Configure API endpoint, GitHub integration, and notification preferences here.</p>
      </SectionCard>
      <SectionCard title="System Status">
        <ul className="space-y-2 text-sm">
          <li className="rounded-md bg-gh-bg/35 px-3 py-2">Backend status: {backendStatus}</li>
          <li className="rounded-md bg-gh-bg/35 px-3 py-2">Backend version: {version}</li>
          <li className="rounded-md bg-gh-bg/35 px-3 py-2">Repository context: {OWNER}/{REPO}</li>
          <li className="rounded-md bg-gh-bg/35 px-3 py-2">Stored analysis reports: {analysisReports}</li>
          <li className="rounded-md bg-gh-bg/35 px-3 py-2">Critical/high findings: {highSeverity}</li>
          <li className="rounded-md bg-gh-bg/35 px-3 py-2">Generated tests: {generatedTests}</li>
        </ul>
      </SectionCard>
    </div>
  );
}
