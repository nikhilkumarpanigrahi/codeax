export type Metric = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
};

export type RepoSummary = {
  fullName: string;
  language: string;
  stars: number;
  health: number;
};

export const dashboardMetrics: Metric[] = [
  { label: "Connected Repositories", value: "12", delta: "+2 this month", trend: "up" },
  { label: "PRs Analyzed", value: "145", delta: "+23 this month", trend: "up" },
  { label: "Security Alerts", value: "8", delta: "-3 resolved", trend: "up" },
  { label: "Estimated Coverage", value: "78%", delta: "+5%", trend: "up" }
];

export const repositories: RepoSummary[] = [
  { fullName: "octo-org/codeax-ai", language: "TypeScript", stars: 314, health: 83 },
  { fullName: "octo-org/platform-api", language: "Python", stars: 198, health: 78 },
  { fullName: "octo-org/workflows", language: "YAML", stars: 92, health: 81 }
];

export const pullRequests = [
  { number: 128, title: "Harden webhook signature validation", author: "nikhilk", status: "open" },
  { number: 124, title: "Improve dashboard loading skeleton", author: "octocat", status: "merged" },
  { number: 121, title: "Add PR trend chart", author: "alice", status: "open" }
];

export const securityFindings = [
  "Webhook signatures use constant-time comparison.",
  "Avoid exposing token parsing errors in responses.",
  "Add dependency scanning to CI pipeline."
];

export const testSuggestions = [
  "Add negative-path tests for malformed webhook signatures.",
  "Create API contract tests for analysis endpoint schemas.",
  "Add UI snapshot tests for dashboard metrics cards."
];
