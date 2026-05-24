import type { QualityAuditReport } from "@/lib/db/queries/governance";

interface QualityAuditViewProps {
  report: QualityAuditReport;
}

export function QualityAuditView({ report }: QualityAuditViewProps) {
  const { leadStats, taskStats, suspectDomains, sourcesToInvestigate } = report;

  return (
    <div className="space-y-6">
      <p className="text-[10px] font-mono text-[#9AA0A6]">
        Généré le{" "}
        {new Date(report.generatedAt).toLocaleString("fr-FR", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Leads PENDING"
          value={`${leadStats.pendingPct}%`}
          sub={`${leadStats.pending} / ${leadStats.total}`}
          color="text-[#FBBF24]"
        />
        <StatCard
          label="Leads KEEP"
          value={`${leadStats.keepPct}%`}
          sub={`${leadStats.keep} leads`}
          color="text-[#4ADE80]"
        />
        <StatCard
          label="Leads STOP"
          value={`${leadStats.stopPct}%`}
          sub={`${leadStats.stop} leads`}
          color="text-[#71717A]"
        />
        <StatCard
          label="Tâches actives"
          value={String(taskStats.active)}
          sub={`${taskStats.planned} planifiées`}
          color="text-[#5B8DEF]"
        />
      </div>

      <section className="bg-[#111317] border border-[#1F232B] rounded-xl p-5">
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#9AA0A6] mb-4">
          Domaines suspects (sans alias)
        </h2>
        {suspectDomains.length === 0 ? (
          <p className="text-xs text-[#9AA0A6]">
            Aucun domaine suspect détecté.
          </p>
        ) : (
          <ul className="space-y-2">
            {suspectDomains.map((d) => (
              <li
                key={d.domain}
                className="flex items-center justify-between text-xs py-2 border-b border-[#1F232B] last:border-0"
              >
                <span className="font-mono text-[#E8EAED]">{d.domain}</span>
                <span className="text-[#F87171] font-mono">
                  {d.taskCount} tâche{d.taskCount > 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-[#111317] border border-[#1F232B] rounded-xl p-5">
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#9AA0A6] mb-4">
          Sources à investiguer (confiance &lt; 0,65)
        </h2>
        {sourcesToInvestigate.length === 0 ? (
          <p className="text-xs text-[#9AA0A6]">Rien à signaler.</p>
        ) : (
          <ul className="space-y-3">
            {sourcesToInvestigate.map((s) => (
              <li
                key={`${s.source}-${s.rawCompany}`}
                className="text-xs space-y-0.5"
              >
                <p className="font-bold text-[#E8EAED]">{s.rawCompany}</p>
                <p className="font-mono text-[#9AA0A6] truncate">{s.source}</p>
                <p className="text-[#FBBF24] font-mono">
                  conf. {s.confidence ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-[#111317] border border-[#1F232B] rounded-xl p-4">
      <p className="text-[10px] font-mono uppercase tracking-wider text-[#9AA0A6] mb-1">
        {label}
      </p>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-[10px] font-mono text-[#9AA0A6] mt-1">{sub}</p>
    </div>
  );
}
