"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { stopCompany } from "@/app/(app)/pipeline/_actions/stop-company";

export function CopilotChat() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/copilot/chat" }),
  });

  const loading = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    void sendMessage({ text: input.trim() });
    setInput("");
  };

  const confirmStopBridgepoint = () => {
    startTransition(async () => {
      await stopCompany({
        company: "Bridgepoint",
        reason: "Confirmé via Copilot",
      });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[720px] bg-[#111317] border border-[#1F232B] rounded-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <Bot className="w-10 h-10 text-[#F5C518] mx-auto" />
            <p className="text-sm text-[#E8EAED] font-semibold">
              Maeva Copilot
            </p>
            <p className="text-xs text-[#9AA0A6] max-w-sm mx-auto">
              « Quelles sociétés n'ont eu aucune action depuis 5 jours ? » · «
              Montre-moi les leads PE confidence &lt; 0.6 »
            </p>
          </div>
        )}

        {messages.map((m) => {
          const text = m.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as { text: string }).text)
            .join("");
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-[#5B8DEF]/20 text-[#5B8DEF]"
                    : "bg-[#F5C518]/20 text-[#F5C518]"
                }`}
              >
                {isUser ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#5B8DEF]/10 border border-[#5B8DEF]/20 text-[#E8EAED]"
                    : "bg-[#0A0B0D] border border-[#1F232B] text-[#E8EAED] prose prose-invert prose-sm max-w-none"
                }`}
              >
                {isUser ? text : <ReactMarkdown>{text}</ReactMarkdown>}
                {!isUser && text.toLowerCase().includes("bridgepoint") && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={confirmStopBridgepoint}
                    className="mt-3 block w-full py-2 text-xs font-bold bg-[#F87171]/20 border border-[#F87171]/40 text-[#F87171] rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    Confirmer STOP Bridgepoint
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#9AA0A6]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Réflexion…
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-[#1F232B] p-3 flex gap-2 bg-[#0A0B0D]"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez une question sur vos données…"
          className="flex-1 px-3 py-2 text-sm bg-[#111317] border border-[#1F232B] rounded-lg text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-[#F5C518] text-[#0A0B0D] rounded-lg font-bold disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
