"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import type { FixtureTask } from "@/lib/db/queries/tasks";

interface CalendarViewProps {
  tasks: FixtureTask[];
}

const WEEKDAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  // Pad start with previous month's days to align Mon=0
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push(d);
  }

  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Pad end to fill 6 rows
  while (days.length < 42) {
    const last2 = days[days.length - 1];
    if (!last2) break;
    const next = new Date(last2);
    next.setDate(next.getDate() + 1);
    days.push(next);
  }
  return days;
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0] ?? "";
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const days = getDaysInMonth(year, month);
  const todayStr = fmt(today);

  // Index tasks by date
  const byDate: Record<string, FixtureTask[]> = {};
  for (const task of tasks) {
    if (!byDate[task.plannedDate]) byDate[task.plannedDate] = [];
    // biome-ignore lint/style/noNonNullAssertion: key guaranteed initialized above
    byDate[task.plannedDate]!.push(task);
  }

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const selectedTasks = selectedDay ? (byDate[selectedDay] ?? []) : [];

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Calendrier vide"
        description="Aucune tâche à afficher pour ce mois."
        icon={<Calendar className="w-5 h-5" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar grid */}
      <div className="bg-[#111317] border border-[#1F232B] rounded-xl overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F232B]">
          <button
            id="calendar-prev-month-btn"
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-[#9AA0A6] hover:text-[#E8EAED] hover:bg-[#16191F] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-bold text-[#E8EAED] font-mono uppercase tracking-wider">
            {MONTHS_FR[month]} {year}
          </h2>
          <button
            id="calendar-next-month-btn"
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-[#9AA0A6] hover:text-[#E8EAED] hover:bg-[#16191F] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[#1F232B]">
          {WEEKDAYS_FR.map((wd) => (
            <div
              key={wd}
              className="text-center text-[9px] font-mono uppercase tracking-widest text-[#9AA0A6] py-2"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, _i) => {
            const dateStr = fmt(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;
            const dayTasks = byDate[dateStr] ?? [];
            const peTasks = dayTasks.filter((t) => t.track === "PE");
            const maTasks = dayTasks.filter((t) => t.track === "MA");

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`relative min-h-[72px] p-2 border-b border-r border-[#1F232B] text-left transition-colors cursor-pointer ${
                  isCurrentMonth ? "bg-[#111317]" : "bg-[#0A0B0D]/60"
                } ${isSelected ? "bg-[#16191F] ring-1 ring-inset ring-[#5B8DEF]/40" : "hover:bg-[#16191F]"}`}
              >
                {/* Day number */}
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono mb-1 ${
                    isToday
                      ? "bg-[#F5C518] text-[#0A0B0D] font-bold"
                      : isCurrentMonth
                        ? "text-[#E8EAED]"
                        : "text-[#9AA0A6]/40"
                  }`}
                >
                  {day.getDate()}
                </span>

                {/* Track dots */}
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {peTasks.slice(0, 3).map((task) => (
                    <span
                      key={`pe-dot-${task.id}`}
                      className="w-1.5 h-1.5 rounded-full bg-[#F5C518]"
                    />
                  ))}
                  {maTasks.slice(0, 3).map((task) => (
                    <span
                      key={`ma-dot-${task.id}`}
                      className="w-1.5 h-1.5 rounded-full bg-[#5B8DEF]"
                    />
                  ))}

                  {dayTasks.length > 6 && (
                    <span className="text-[8px] font-mono text-[#9AA0A6]">
                      +{dayTasks.length - 6}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="bg-[#111317] border border-[#1F232B] rounded-xl p-5 animate-fadeIn">
          <h3 className="text-xs font-mono font-bold text-[#E8EAED] uppercase tracking-wider mb-3">
            {new Date(`${selectedDay}T12:00:00`).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {selectedTasks.length} tâche
            {selectedTasks.length !== 1 ? "s" : ""}
          </h3>
          {selectedTasks.length === 0 ? (
            <p className="text-xs text-[#9AA0A6]">Aucune tâche ce jour.</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      task.track === "PE" ? "bg-[#F5C518]" : "bg-[#5B8DEF]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#E8EAED] truncate">
                      {task.company}
                    </p>
                    <p className="text-[10px] text-[#9AA0A6] font-mono">
                      {task.stepCode.replace(/_/g, " ")} · {task.channel}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      task.track === "PE"
                        ? "text-[#F5C518] bg-[#F5C518]/10"
                        : "text-[#5B8DEF] bg-[#5B8DEF]/10"
                    }`}
                  >
                    {task.track}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
