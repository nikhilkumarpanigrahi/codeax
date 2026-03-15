"use client";

import { useEffect, useMemo, useState } from "react";

import { SectionCard } from "@/components/common/section-card";
import { fetchJson, type AnalysisResult } from "@/lib/api";
import { pullRequests } from "@/lib/data";

type PullRequestSummary = {
  number: number;
  title: string;
  author: string;
  status: string;
};

const DEFAULT_OWNER = "nikhilkumarpanigrahi";
const DEFAULT_REPO = "codeax";
const OWNER = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_OWNER || DEFAULT_OWNER;
const REPO = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_REPO || DEFAULT_REPO;

export default function PullRequestsPage() {
  const [items, setItems] = useState<PullRequestSummary[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const fallbackFindings = useMemo(
    () => [
      {
        severity: "info",
        category: "code_quality",
        title: "No major code quality blockers detected",
        details: "Keep functions small and explicit for maintainability.",
      },
    ],
    [],
  );

  const fallbackTests = useMemo(
    () => ["Add unit tests for modified modules and a regression test for the PR scenario"],
    [],
  );

  useEffect(() => {
    fetchJson<PullRequestSummary[]>(`/api/pull-requests/${OWNER}/${REPO}`)
      .then((data) => {
        setItems(data);
        if (data.length > 0) {
          setSelected(data[0].number);
        }
      })
      .catch(() => {
        setItems(pullRequests);
        if (pullRequests.length > 0) {
          setSelected(pullRequests[0].number);
        }
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setError("");
    setAnalysis(null);
    setLoadingAnalysis(true);
    fetchJson<AnalysisResult>(`/api/analysis/${OWNER}/${REPO}/pr/${selected}`)
      .then((data) => setAnalysis(data))
      .catch(() => {
        setAnalysis(null);
        setError("No analysis report yet. Trigger it via webhook or POST /api/analysis/{owner}/{repo}/pr/{pr_number}.");
      })
      .finally(() => setLoadingAnalysis(false));
  }, [selected]);

  const selectedTitle = useMemo(() => items.find((item) => item.number === selected)?.title || "", [items, selected]);
  const findingsToDisplay = analysis && analysis.findings.length > 0 ? analysis.findings : fallbackFindings;
  const testsToDisplay = analysis && analysis.generated_tests.length > 0 ? analysis.generated_tests : fallbackTests;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SectionCard title="Pull Requests">
        <ul className="space-y-3">
          {items.map((pr) => (
            <li key={pr.number}>
              <button
                type="button"
                onClick={() => setSelected(pr.number)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  selected === pr.number
                    ? "border-gh-green bg-gh-green/10 shadow-[0_0_28px_rgba(42,209,120,0.18)]"
                    : "border-gh-border bg-gh-bg/70 hover-lift"
                }`}
              >
                <p className="font-medium text-gh-heading">#{pr.number} {pr.title}</p>
                <p className="text-sm">{pr.author} · {pr.status}</p>
              </button>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="space-y-4 lg:col-span-2">
        <SectionCard title="PR Analysis View">
          <p className="text-xs text-gh-muted">Repository: {OWNER}/{REPO}</p>
          <p className="text-sm">Selected PR: {selected ? `#${selected} ${selectedTitle}` : "None"}</p>
          {loadingAnalysis ? <p className="mt-2 text-sm text-gh-text/85">Loading latest coordinator analysis...</p> : null}
          {error ? <p className="mt-2 text-sm text-amber-300">{error}</p> : null}
          {analysis ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="hover-lift rounded-xl border border-gh-border bg-gh-bg/70 p-3 text-sm">Type: {analysis.pr_type}</div>
              <div className="hover-lift rounded-xl border border-gh-border bg-gh-bg/70 p-3 text-sm">Health Score: {analysis.health.overall}%</div>
              <div className="hover-lift rounded-xl border border-gh-border bg-gh-bg/70 p-3 text-sm">Security Score: {analysis.health.security}%</div>
              <div className="hover-lift rounded-xl border border-gh-border bg-gh-bg/70 p-3 text-sm">Code Quality: {analysis.health.code_quality}%</div>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="AI Findings">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {findingsToDisplay.map((finding) => (
              <li key={`${finding.category}-${finding.title}`}>
                [{finding.severity}] {finding.title}: {finding.details}
              </li>
            ))}
          </ul>
          {analysis ? (
            <p className="mt-3 text-xs text-gh-text/80">Source: Coordinator analysis for selected PR.</p>
          ) : (
            <p className="mt-3 text-xs text-gh-text/80">Source: Baseline guidance while PR analysis is unavailable.</p>
          )}
        </SectionCard>

        <SectionCard title="Generated Tests">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {testsToDisplay.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {analysis ? (
            <p className="mt-3 text-xs text-gh-text/80">Source: Test Generator output for selected PR.</p>
          ) : (
            <p className="mt-3 text-xs text-gh-text/80">Source: Baseline guidance while PR analysis is unavailable.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
