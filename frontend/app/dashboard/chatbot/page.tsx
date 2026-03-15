"use client";

import { BoltStyleChat } from "@/components/ui/bolt-style-chat";
import { postJson, type ChatResponse } from "@/lib/api";

type ConversationItem = { role: "user" | "assistant"; text: string };

const DEFAULT_OWNER = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_OWNER || "nikhilkumarpanigrahi";
const DEFAULT_REPO = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_REPO || "codeax";

export default function ChatbotPage() {
  const handleSend = async (message: string, conversation: ConversationItem[]) => {
    const history = conversation.slice(-12).map((item) => ({ role: item.role, content: item.text }));

    const response = await postJson<
      ChatResponse,
      { message: string; owner: string; repo: string; conversation: Array<{ role: "user" | "assistant"; content: string }> }
    >("/api/chat/", {
      message,
      owner: DEFAULT_OWNER,
      repo: DEFAULT_REPO,
      conversation: history,
    });

    return response.answer || "No response returned by chatbot API.";
  };

  return (
    <BoltStyleChat
      announcementText="Codeax AI Chat"
      subtitle={`Repository-aware assistant for ${DEFAULT_OWNER}/${DEFAULT_REPO}`}
      placeholder="Ask Codeax to analyze your repo, PRs, security, or tests..."
      onSend={handleSend}
      initialMessages={[
        {
          role: "assistant",
          text: `I am Codeax. Ask me about ${DEFAULT_OWNER}/${DEFAULT_REPO} health, security, pull requests, and tests.`,
        },
      ]}
    />
  );
}
