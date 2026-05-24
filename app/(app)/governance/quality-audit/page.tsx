import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QualityAuditView } from "@/components/governance/quality-audit-view";
import { auth } from "@/lib/auth";
import { buildQualityAuditReport } from "@/lib/db/queries/governance";

export const metadata: Metadata = {
  title: "Quality Audit — Gouvernance",
};

export default async function QualityAuditPage() {
  const { user } = await auth();
  if (!user) redirect("/login");

  const report = await buildQualityAuditReport();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#1F232B] pb-5">
        <Link
          href="/governance"
          className="text-[10px] font-mono text-[#5B8DEF] hover:underline"
        >
          ← Gouvernance
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-2">
          Quality Audit
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1">
          Rapport généré à la demande
        </p>
      </div>

      <QualityAuditView report={report} />
    </div>
  );
}
