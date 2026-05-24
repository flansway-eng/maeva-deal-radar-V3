import { tool } from "ai";
import { z } from "zod";
import { getDashboardKpis } from "@/lib/db/queries/dashboard";
import { FIXTURE_LEADS } from "@/lib/db/queries/governance-fixture";
import { getAllTasks, getRecentEvents } from "@/lib/db/queries/tasks";

export const copilotTools = {
  getPipelineSummary: tool({
    description:
      "KPI du pipeline (tâches actives, du jour, retard, exécution 7j)",
    inputSchema: z.object({}),
    execute: async () => {
      const kpis = await getDashboardKpis();
      return kpis;
    },
  }),

  listTasks: tool({
    description: "Liste paginée de tâches avec filtres optionnels",
    inputSchema: z.object({
      status: z
        .enum(["PLANNED", "DONE", "POSTPONED", "CANCELLED", "STOPPED"])
        .optional(),
      track: z.enum(["PE", "MA"]).optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(25).default(10),
    }),
    execute: async ({ status, track, search, limit }) => {
      const tasks = await getAllTasks({ status, track, search });
      return tasks.slice(0, limit).map((t) => ({
        id: t.id,
        company: t.company,
        track: t.track,
        status: t.status,
        stepCode: t.stepCode,
        plannedDate: t.plannedDate,
        channel: t.channel,
      }));
    },
  }),

  getLead: tool({
    description: "Détail d'un lead par id",
    inputSchema: z.object({ leadId: z.string().min(1) }),
    execute: async ({ leadId }) => {
      const lead = FIXTURE_LEADS.find((l) => l.id === leadId);
      if (!lead) return { error: "Lead introuvable" };
      return lead;
    },
  }),

  getEventsForCompany: tool({
    description: "Historique journal pour une société",
    inputSchema: z.object({ company: z.string().min(1) }),
    execute: async ({ company }) => {
      const events = await getRecentEvents(100);
      return events.filter(
        (e) =>
          e.company?.toLowerCase().includes(company.toLowerCase()) ?? false,
      );
    },
  }),

  proposeAction: tool({
    description:
      "Propose une action sur une tâche — nécessite confirmation manuelle de Maeva",
    inputSchema: z.object({
      taskId: z.string().min(1),
      action: z.enum(["DONE", "POSTPONE", "STOP_COMPANY", "CANCEL"]),
      reason: z.string().max(500).optional(),
    }),
    execute: async ({ taskId, action, reason }) => ({
      type: "proposed_action",
      taskId,
      action,
      reason: reason ?? null,
      requiresConfirmation: true,
    }),
  }),
};
