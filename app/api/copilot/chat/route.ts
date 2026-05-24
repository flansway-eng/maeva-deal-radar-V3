import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { getAnthropicModel, hasAnthropicApiKey } from "@/lib/ai/anthropic";
import { copilotTools } from "@/lib/copilot/tools";

const SYSTEM = `Tu es Maeva Copilot, assistant de prospection M&A/PE pour Maeva.
Tu as accès aux données via des tools. Réponds en français, markdown sobre.
Quand tu proposes une action (proposeAction), indique clairement que Maeva doit confirmer dans l'interface.
Ne invente pas de chiffres — utilise les tools.`;

function extractLastUserText(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last) return "";
  return last.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function mockCopilotReply(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("retard") || q.includes("5 jours")) {
    return "D'après le pipeline, plusieurs tâches **PLANNED** ont une date antérieure à aujourd'hui. Ouvrez `/pipeline` pour les prioriser.";
  }
  if (q.includes("confidence") || q.includes("lead")) {
    return "Consultez `/governance/review` pour les leads à faible confidence. Avec la clé Anthropic, j'utilise le tool `listTasks`.";
  }
  if (q.includes("bridgepoint") || q.includes("stop")) {
    return "Je **propose** d'arrêter la séquence Bridgepoint. Utilisez le bouton de confirmation ou le menu pipeline **Stopper la séquence**.";
  }
  return "Mode démo actif (sans `ANTHROPIC_API_KEY`). Questions pipeline, retards, leads — ou ajoutez la clé API pour le tool use complet.";
}

export async function POST(request: Request) {
  const body = (await request.json()) as { messages?: UIMessage[] };
  const messages = body.messages ?? [];

  if (!hasAnthropicApiKey()) {
    const reply = mockCopilotReply(extractLastUserText(messages));
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const id = "mock-text";
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: reply });
        writer.write({ type: "text-end", id });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  const result = streamText({
    model: getAnthropicModel(),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: copilotTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
