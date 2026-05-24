import type { FixtureTask } from "@/lib/db/queries/tasks";
import { KanbanBoard } from "./kanban-board";

interface KanbanViewProps {
  tasks: FixtureTask[];
}

export function KanbanView({ tasks }: KanbanViewProps) {
  return <KanbanBoard tasks={tasks} />;
}
