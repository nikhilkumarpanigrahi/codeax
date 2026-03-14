"use client";

import { FormEvent, useMemo, useState } from "react";

import { SectionCard } from "@/components/common/section-card";
import { postJson, type ChatResponse } from "@/lib/api";

type UiMessage = {
  role: "user" | "assistant";
  text: string;
};

const DEFAULT_OWNER = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_OWNER || "nikhilkumarpanigrahi";
const DEFAULT_REPO = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_REPO || "codeax";

export default function ChatbotPage() {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: "assistant",
      text: `I am RepoGuardian Chatbot. Ask me about ${DEFAULT_OWNER}/${DEFAULT_REPO} health, PRs, security, or tests.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSuggestions, setLastSuggestions] = useState<string[]>([]);
  const [isGrokMode, setIsGrokMode] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const sendMessage = async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    setError("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    try {
      const history = messages.slice(-12).map((item) => ({ role: item.role, content: item.text }));

      const response = await postJson<ChatResponse, { message: string; owner: string; repo: string; conversation: Array<{ role: "user" | "assistant"; content: string }> }>("/api/chat/", {
        message: trimmed,
        owner: DEFAULT_OWNER,
        repo: DEFAULT_REPO,
        conversation: history,
      });

      setMessages((prev) => [...prev, { role: "assistant", text: response.answer }]);
      setLastSuggestions(response.suggestions || []);
      setIsGrokMode(Boolean(response.context?.using_grok));
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I could not reach the chatbot API. Please make sure backend is running on port 8000.",
        },
      ]);
      setError("Chat API request failed.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="RepoGuardian Chatbot">
        <p className="text-sm text-gh-text">Repository context: {DEFAULT_OWNER}/{DEFAULT_REPO}</p>
        <p className="mt-1 text-xs text-gh-text/80">Mode: {isGrokMode ? "Grok LLM" : "Rule-based fallback"}</p>
      </SectionCard>

      <SectionCard title="Conversation">
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-lg border px-4 py-3 text-sm ${
                message.role === "user"
                  ? "border-gh-green bg-gh-green/10 text-gh-heading"
                  : "border-gh-border bg-gh-bg text-gh-text"
              }`}
            >
              <p className="mb-1 text-xs uppercase tracking-wide text-gh-text/80">{message.role}</p>
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about health summary, security risks, open PRs, or test suggestions..."
            rows={3}
            className="w-full rounded-lg border border-gh-border bg-gh-bg px-3 py-2 text-sm text-gh-text outline-none ring-gh-green focus:ring-2"
          />
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={!canSend}
              className="rounded-md bg-gh-green px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Thinking..." : "Send"}
            </button>
            {error ? <span className="text-xs text-amber-300">{error}</span> : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Try These Prompts">
        <div className="flex flex-wrap gap-2">
          {(lastSuggestions.length > 0
            ? lastSuggestions
            : ["Show health summary", "Any security issues?", "List open pull requests", "What tests should we add?"]
          ).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void sendMessage(suggestion)}
              disabled={loading}
              className="rounded-full border border-gh-border bg-gh-bg px-3 py-1 text-xs text-gh-text transition hover:border-gh-green hover:text-gh-heading disabled:cursor-not-allowed disabled:opacity-60"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
