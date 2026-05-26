"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { stopCompany } from "@/app/(app)/pipeline/_actions/stop-company";

const QUICK_PROMPTS: { label: string; prompt: string }[] = [
  {
    label: "Leads sans séquence",
    prompt:
      "Quels leads avec le statut KEEP n'ont pas encore de séquence de prospection créée ?",
  },
  {
    label: "Tâches en retard",
    prompt:
      "Liste toutes les tâches PLANNED dont la date planifiée est dépassée, triées par ancienneté.",
  },
  {
    label: "Bilan 7 jours",
    prompt:
      "Résume mon activité sur les 7 derniers jours : tâches exécutées, sociétés contactées, taux d'exécution.",
  },
  {
    label: "Top leads PE",
    prompt:
      "Quels sont mes leads PE avec le meilleur score de confiance ? Donne-moi le top 5.",
  },
  {
    label: "Sociétés silencieuses",
    prompt:
      "Quelles sociétés n'ont eu aucune action (DONE) depuis plus de 7 jours malgré des tâches planifiées ?",
  },
];

export function CopilotChat() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
          <div className="flex flex-col items-center justify-center h-full py-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="relative mx-auto w-12 h-12">
                <div className="absolute inset-0 rounded-full bg-[#F5C518]/10 animate-ping opacity-50" />
                <div className="relative w-12 h-12 rounded-full bg-[#F5C518]/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-[#F5C518]" />
                </div>
              </div>
              <p className="text-sm text-[#E8EAED] font-semibold">
                Maeva Copilot
              </p>
              <p className="text-xs text-[#9AA0A6] max-w-xs mx-auto leading-relaxed">
                Interrogez vos données pipeline en langage naturel.
              </p>
            </div>

            {/* Quick prompts */}
            <div className="w-full max-w-md space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#9AA0A6] text-center">
                Suggestions rapides
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.map(({ label, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setInput(prompt);
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-1.5 text-[10px] font-mono font-medium bg-[#0A0B0D] border border-[#1F232B] rounded-full text-[#9AA0A6] hover:text-[#E8EAED] hover:border-[#F5C518]/40 hover:bg-[#F5C518]/5 transition-all cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
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
          ref={inputRef}
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
