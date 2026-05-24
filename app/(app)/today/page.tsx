import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TodayFileClient } from "@/components/today/today-file-client";
import { auth } from "@/lib/auth";
import { getTodayTasks } from "@/lib/db/queries/tasks";

export const metadata: Metadata = {
  title: "File du Jour — Maeva Deal Radar Room",
  description: "Vos tâches du jour triées par canal et date.",
};

export default async function TodayPage() {
  const { user } = await auth();
  if (!user) redirect("/login");

  const tasks = await getTodayTasks();

  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return <TodayFileClient initialTasks={tasks} todayLabel={todayLabel} />;
}
