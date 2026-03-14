const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ApiIssue = {
  severity: string;
  category: string;
  title: string;
  details: string;
};

export type AnalysisResult = {
  repository: string;
  pr_number: number;
  pr_type: string;
  score: number;
  coordinator_reasoning: string;
  findings: ApiIssue[];
  generated_tests: string[];
  auto_fix_suggestions: string[];
  documentation_recommendations: string[];
  dependency_risks: string[];
  recommendation: string;
  health: {
    code_quality: number;
    security: number;
    tests: number;
    technical_debt: number;
    overall: number;
  };
  generated_at: string;
};

export type ChatRequest = {
  message: string;
  owner?: string;
  repo?: string;
  conversation?: Array<{ role: "user" | "assistant"; content: string }>;
};

export type ChatResponse = {
  answer: string;
  suggestions: string[];
  context: Record<string, string | number | boolean | null>;
};

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function postJson<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}
