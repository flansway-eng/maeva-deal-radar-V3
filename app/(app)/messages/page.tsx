import type { Metadata } from "next";
import { MessageLibrary } from "@/components/messages/message-library";
import { getAllTasks } from "@/lib/db/queries/tasks";

export const metadata: Metadata = {
  title: "Messages — Maeva Deal Radar Room",
  description: "Bibliothèque de messages et éditeur de séquences.",
};

export default async function MessagesPage() {
  const tasks = await getAllTasks();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#1F232B] pb-5">
        <span className="text-[10px] font-mono text-[#F5C518] uppercase tracking-widest font-bold">
          MODULE 7
        </span>
        <h1
          id="messages-title"
          className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-1"
        >
          Messages & Séquences
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1">
          {tasks.length} tâches · Éditeur Tiptap · Génération Claude · Linter
          qualité live
        </p>
      </div>

      <MessageLibrary tasks={tasks} />
    </div>
  );
}
