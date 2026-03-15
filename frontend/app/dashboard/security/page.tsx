import { SectionCard } from "@/components/common/section-card";
import { fetchJson } from "@/lib/api";
import { securityFindings } from "@/lib/data";

const OWNER = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_OWNER || "nikhilkumarpanigrahi";
const REPO = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_REPO || "codeax";

type SecuritySummary = {
  security_findings: Array<{ severity: string; title: string; details: string }>;
  dependency_risks: string[];
  auto_fix_suggestions: string[];
  critical_or_high_count: number;
};

export default async function SecurityPage() {
  let findings = securityFindings;
  let dependencyRisks: string[] = [];
  let autoFixes: string[] = [];
  let criticalCount = 0;

  try {
    const summary = await fetchJson<SecuritySummary>(`/api/analysis/${OWNER}/${REPO}/security`);
    if (summary.security_findings.length > 0) {
      findings = summary.security_findings.map((item) => `[${item.severity}] ${item.title}: ${item.details}`);
    }
    dependencyRisks = summary.dependency_risks;
    autoFixes = summary.auto_fix_suggestions;
    criticalCount = summary.critical_or_high_count;
  } catch {
    // Static fallback is already provided.
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Security Review">
        <p className="mb-2 text-xs text-gh-text/80">Critical/High findings: {criticalCount}</p>
        <ul className="list-disc space-y-2 pl-5">
          {findings.map((item) => (
            <li key={item} className="rounded-md bg-gh-bg/35 px-2 py-1">{item}</li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Dependency Risk Monitoring">
        {dependencyRisks.length > 0 ? (
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {dependencyRisks.map((item) => (
              <li key={item} className="rounded-md bg-gh-bg/35 px-2 py-1">{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">The backend scans changed dependency manifests and lockfiles for known risky versions and reports recommendations.</p>
        )}
      </SectionCard>
      <SectionCard title="AI Auto Fix Suggestions">
        {autoFixes.length > 0 ? (
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {autoFixes.map((item) => (
              <li key={item} className="rounded-md bg-gh-bg/35 px-2 py-1">{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">When injection or secret exposure patterns are detected, the system proposes secure code replacement snippets.</p>
        )}
      </SectionCard>
    </div>
  );
}
