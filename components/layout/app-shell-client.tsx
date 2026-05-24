"use client";

import { CommandPalette } from "@/components/shared/command-palette";
import type { FixtureTask } from "@/lib/db/queries/tasks";

interface AppShellClientProps {
  tasks: FixtureTask[];
}

export function AppShellClient({ tasks }: AppShellClientProps) {
  return <CommandPalette tasks={tasks} />;
}
