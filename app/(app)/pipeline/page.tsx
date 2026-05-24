import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PipelineClient } from "@/components/pipeline/pipeline-client";
import { auth } from "@/lib/auth";
import { getAllTasks } from "@/lib/db/queries/tasks";

export const metadata: Metadata = {
  title: "Pipeline — Maeva Deal Radar Room",
  description:
    "Vue Kanban, Liste et Calendrier de vos séquences de prospection M&A & PE.",
};

export default async function PipelinePage() {
  const { user } = await auth();
  if (!user) redirect("/login");

  // Fetch all tasks server-side (no filters — client handles filtering)
  const tasks = await getAllTasks();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#1F232B] pb-5">
        <span className="text-[10px] font-mono text-[#5B8DEF] uppercase tracking-widest font-bold">
          MODULE 4
        </span>
        <h1
          id="pipeline-title"
          className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-1"
        >
          Pipeline & Pilotage
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1">
          {tasks.length} tâche{tasks.length !== 1 ? "s" : ""} au total · Kanban
          · Liste · Calendrier
        </p>
      </div>

      <PipelineClient tasks={tasks} />
    </div>
  );
}
