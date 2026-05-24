import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MessageEditorWorkspace } from "@/components/messages/message-editor-workspace";
import { auth } from "@/lib/auth";
import {
  getMessageContext,
  getSequenceStepsForCompany,
  getTaskById,
} from "@/lib/db/queries/messages";

export const metadata: Metadata = {
  title: "Éditeur de message — Maeva Deal Radar Room",
};

interface PageProps {
  params: Promise<{ taskId: string }>;
}

export default async function MessageEditorPage({ params }: PageProps) {
  const { user } = await auth();
  if (!user) redirect("/login");

  const { taskId } = await params;
  const task = await getTaskById(taskId);
  if (!task) notFound();

  const [context, sequenceSteps] = await Promise.all([
    getMessageContext(taskId),
    getSequenceStepsForCompany(task.company),
  ]);

  if (!context) notFound();

  return (
    <div className="animate-fadeIn">
      <MessageEditorWorkspace
        task={task}
        sequenceSteps={sequenceSteps}
        context={context}
      />
    </div>
  );
}
