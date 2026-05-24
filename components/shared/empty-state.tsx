import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "Aucune donnée",
  description = "Aucun élément à afficher pour le moment.",
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#111317] border border-[#1F232B] flex items-center justify-center text-[#9AA0A6]">
        {icon ?? <Inbox className="w-5 h-5" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[#E8EAED]">{title}</p>
        <p className="text-xs text-[#9AA0A6] max-w-xs">{description}</p>
      </div>
    </div>
  );
}
