"use client";

import { useRef, useState } from "react";
import { TodayTaskCard } from "@/components/pipeline/today-task-card";
import type { FixtureTask } from "@/lib/db/queries/tasks";

const SWIPE_THRESHOLD = 72;

interface TodaySwipeListProps {
  tasks: FixtureTask[];
  exitingIds: Set<string>;
  onDone: (task: FixtureTask) => void;
  onPostpone: (task: FixtureTask) => void;
  onOpenDetail: (task: FixtureTask) => void;
}

export function TodaySwipeList({
  tasks,
  exitingIds,
  onDone,
  onPostpone,
  onOpenDetail,
}: TodaySwipeListProps) {
  return (
    <div className="space-y-3">
      {tasks.map((task, i) => (
        <SwipeableCard
          key={task.id}
          task={task}
          index={i}
          exiting={exitingIds.has(task.id)}
          onDone={() => onDone(task)}
          onPostpone={() => onPostpone(task)}
          onOpenDetail={() => onOpenDetail(task)}
        />
      ))}
    </div>
  );
}

function SwipeableCard({
  task,
  index,
  exiting,
  onDone,
  onPostpone,
  onOpenDetail,
}: {
  task: FixtureTask;
  index: number;
  exiting: boolean;
  onDone: () => void;
  onPostpone: () => void;
  onOpenDetail: () => void;
}) {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? 0;
    setSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const x = e.touches[0]?.clientX ?? 0;
    setOffset(x - startX.current);
  };

  const onTouchEnd = () => {
    setSwiping(false);
    if (offset > SWIPE_THRESHOLD) {
      onDone();
    } else if (offset < -SWIPE_THRESHOLD) {
      onPostpone();
    }
    setOffset(0);
  };

  const bgHint =
    offset > 20 ? "bg-[#4ADE80]/10" : offset < -20 ? "bg-[#FBBF24]/10" : "";

  return (
    <div
      className={`relative touch-pan-y rounded-xl overflow-hidden ${bgHint}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      style={{
        transform: exiting ? undefined : `translateX(${offset}px)`,
        transition: swiping ? "none" : "transform 200ms ease-out",
      }}
    >
      {offset > 20 && !exiting && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[#4ADE80]">
          DONE
        </span>
      )}
      {offset < -20 && !exiting && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[#FBBF24]">
          +1J
        </span>
      )}
      <TodayTaskCard
        task={task}
        index={index}
        exiting={exiting}
        onDone={onDone}
        onPostpone={onPostpone}
        onOpenDetail={onOpenDetail}
      />
    </div>
  );
}
