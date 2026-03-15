import { SectionCard } from "@/components/common/section-card";
import { fetchJson } from "@/lib/api";
import { testSuggestions } from "@/lib/data";

const OWNER = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_OWNER || "nikhilkumarpanigrahi";
const REPO = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_REPO || "codeax";

type TestSummary = {
  generated_tests: string[];
  documentation_recommendations: string[];
  analysis_reports: number;
};

export default async function TestsPage() {
  let suggestions = testSuggestions;
  let documentationRecommendations: string[] = [];
  let analysisReports = 0;

  try {
    const summary = await fetchJson<TestSummary>(`/api/analysis/${OWNER}/${REPO}/tests`);
    if (summary.generated_tests.length > 0) {
      suggestions = summary.generated_tests;
    }
    documentationRecommendations = summary.documentation_recommendations;
    analysisReports = summary.analysis_reports;
  } catch {
    // Keep fallback static content.
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Generated Test Suggestions">
        <p className="mb-2 text-xs text-gh-text/80">Analysis reports considered: {analysisReports}</p>
        <ul className="list-disc space-y-2 pl-5">
          {suggestions.map((item) => (
            <li key={item} className="rounded-md bg-gh-bg/35 px-2 py-1">{item}</li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Code Change Intelligence">
        <p className="text-sm">PRs are classified as feature, bug fix, refactor, or security update so tests and analysis paths are selected intelligently.</p>
      </SectionCard>
      <SectionCard title="Documentation Assistant">
        {documentationRecommendations.length > 0 ? (
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {documentationRecommendations.map((item) => (
              <li key={item} className="rounded-md bg-gh-bg/35 px-2 py-1">{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">When API/module changes are detected, the system suggests README and usage-doc updates.</p>
        )}
      </SectionCard>
    </div>
  );
}
