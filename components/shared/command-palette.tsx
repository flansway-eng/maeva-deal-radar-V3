"use client";

import { Command } from "cmdk";
import {
  Calendar,
  CheckCircle2,
  History,
  LayoutGrid,
  PauseCircle,
  Radio,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { markTaskDone } from "@/app/(app)/pipeline/_actions/mark-task-done";
import { postponeTask } from "@/app/(app)/pipeline/_actions/postpone-task";
import { semanticSearchAction } from "@/lib/actions/search/semantic-search";
import type { SemanticSearchResult } from "@/lib/ai/embeddings";
import type { FixtureTask } from "@/lib/db/queries/tasks";
import { addDaysIso, todayParisIso } from "@/lib/pipeline/dates";

interface CommandPaletteProps {
  tasks: FixtureTask[];
}

export function CommandPalette({ tasks }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [semanticResults, setSemanticResults] = useState<
    SemanticSearchResult[]
  >([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayTasks = tasks.filter(
    (t) =>
      t.plannedDate === todayParisIso() &&
      (t.status === "PLANNED" || t.status === "POSTPONED"),
  );
  const firstToday = todayTasks[0];

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  useEffect(() => {
    const btn = document.getElementById("cmd-k-trigger-btn");
    if (!btn) return;
    const handler = () => setOpen(true);
    btn.addEventListener("click", handler);
    return () => btn.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSemanticResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setSemanticResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await semanticSearchAction(query);
      setSemanticResults(results);
      setSearching(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const runAction = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      await fn();
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4 bg-black/60">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fermer"
        onClick={() => setOpen(false)}
      />
      <Command
        className="relative w-full max-w-lg bg-[#111317] border border-[#1F232B] rounded-xl shadow-2xl overflow-hidden"
        label="Palette de commandes"
        shouldFilter={semanticResults.length === 0}
      >
        <div className="flex items-center gap-2 px-3 border-b border-[#1F232B]">
          <Search className="w-4 h-4 text-[#9AA0A6] shrink-0" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Chercher un lead ou un signal… ex: fonds mid-cap Paris actifs"
            className="flex-1 py-3 bg-transparent text-sm text-[#E8EAED] placeholder-[#9AA0A6]/50 focus:outline-none"
          />
          <kbd className="hidden sm:inline text-[10px] font-mono text-[#9AA0A6] px-1.5 py-0.5 border border-[#1F232B] rounded">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-xs text-[#9AA0A6]">
            {searching
              ? "Recherche sémantique…"
              : query.length >= 3
                ? "Aucun résultat sémantique"
                : "Aucun résultat"}
          </Command.Empty>

          {semanticResults.length > 0 && (
            <Command.Group
              heading="Recherche sémantique"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-[#F5C518]"
            >
              {semanticResults.map((r) => (
                <PaletteItem
                  key={`${r.entityType}-${r.entityId}`}
                  value={`${r.title} ${r.snippet ?? ""}`}
                  icon={
                    r.entityType === "lead" ? (
                      <Users className="w-4 h-4 text-[#5B8DEF]" />
                    ) : (
                      <Radio className="w-4 h-4 text-[#F5C518]" />
                    )
                  }
                  label={`${r.entityType === "lead" ? "Lead" : "Signal"} · ${r.title} (${Math.round(r.score * 100)}%)`}
                  onSelect={() =>
                    navigate(
                      r.entityType === "lead" ? `/leads/${r.entityId}` : "/",
                    )
                  }
                />
              ))}
            </Command.Group>
          )}

          <Command.Group
            heading="Navigation"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-[#9AA0A6]"
          >
            <PaletteItem
              icon={<Calendar className="w-4 h-4" />}
              label="File du jour"
              onSelect={() => navigate("/today")}
            />
            <PaletteItem
              icon={<LayoutGrid className="w-4 h-4" />}
              label="Pipeline Kanban"
              onSelect={() => navigate("/pipeline")}
            />
            <PaletteItem
              icon={<History className="w-4 h-4" />}
              label="Journal d'activité"
              onSelect={() => navigate("/journal")}
            />
            <PaletteItem
              icon={<Sparkles className="w-4 h-4" />}
              label="Copilot"
              onSelect={() => navigate("/copilot")}
            />
          </Command.Group>

          {firstToday && (
            <Command.Group
              heading="Actions rapides"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-[#9AA0A6]"
            >
              <PaletteItem
                icon={<CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />}
                label={`Marquer fait — ${firstToday.company}`}
                disabled={pending}
                onSelect={() =>
                  runAction(() => markTaskDone({ taskId: firstToday.id }))
                }
              />
              <PaletteItem
                icon={<PauseCircle className="w-4 h-4 text-[#FBBF24]" />}
                label={`Reporter (+1j) — ${firstToday.company}`}
                disabled={pending}
                onSelect={() =>
                  runAction(() =>
                    postponeTask({
                      taskId: firstToday.id,
                      newPlannedDate: addDaysIso(todayParisIso(), 1),
                      note: "Via Cmd+K",
                    }),
                  )
                }
              />
            </Command.Group>
          )}

          <Command.Group
            heading="Sociétés"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-[#9AA0A6]"
          >
            {tasks.slice(0, 12).map((t) => (
              <PaletteItem
                key={t.id}
                value={`${t.company} ${t.track} ${t.status}`}
                icon={<LayoutGrid className="w-4 h-4" />}
                label={`${t.company} · ${t.status}`}
                onSelect={() => navigate("/pipeline")}
              />
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

function PaletteItem({
  icon,
  label,
  value,
  onSelect,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <Command.Item
      value={value ?? label}
      disabled={disabled}
      onSelect={onSelect}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#E8EAED] cursor-pointer data-[selected=true]:bg-[#1F232B] aria-disabled:opacity-50"
    >
      <span className="text-[#9AA0A6]">{icon}</span>
      {label}
    </Command.Item>
  );
}
