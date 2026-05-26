import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfidenceBar } from "@/components/leads/confidence-bar";
import { LeadPappersPanel } from "@/components/leads/lead-pappers-panel";
import { GenerateSequenceButton } from "@/components/leads/generate-sequence-button";
import { LeadQualifyPanel } from "@/components/leads/lead-qualify-panel";
import { ReviewStatusBadge } from "@/components/leads/review-status-badge";
import { TrackBadge } from "@/components/shared/track-badge";
import {
  getLeadById,
  hasPappersKeyConfigured,
} from "@/lib/db/queries/leads";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const [lead, hasPappersKey] = await Promise.all([
    getLeadById(id),
    hasPappersKeyConfigured(),
  ]);
  if (!lead) notFound();

  const confidence = lead.confidenceScore
    ? Number.parseFloat(lead.confidenceScore)
    : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#1F232B] pb-5">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#5B8DEF] hover:text-[#F5C518] mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la shortlist
        </Link>
        <h1 className="text-2xl font-extrabold text-[#E8EAED]">
          {lead.companyName}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <TrackBadge track={lead.track} />
          <ReviewStatusBadge status={lead.reviewStatus} />
          {lead.reviewStatus === "KEEP" && (
            <GenerateSequenceButton
              leadId={lead.id}
              companyName={lead.companyName}
              variant="primary"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Detail label="Confidence">
          <ConfidenceBar score={confidence} />
        </Detail>
        <Detail label="Target role">{lead.targetRole ?? "—"}</Detail>
        <Detail label="Signal">{lead.primarySignal ?? "—"}</Detail>
        <Detail label="Website">
          {lead.website ? (
            <a
              href={
                lead.website.startsWith("http")
                  ? lead.website
                  : `https://${lead.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5B8DEF] hover:underline"
            >
              {lead.website}
            </a>
          ) : (
            "—"
          )}
        </Detail>
        <Detail label="Page URL">
          {lead.pageUrl ? (
            <a
              href={lead.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5B8DEF] hover:underline break-all"
            >
              {lead.pageUrl}
            </a>
          ) : (
            "—"
          )}
        </Detail>
        <Detail label="Nom original">{lead.companyNameOriginal ?? "—"}</Detail>
      </div>

      <LeadPappersPanel
        leadId={lead.id}
        hasPappersKey={hasPappersKey}
        siren={lead.siren}
        capitalSocial={lead.capitalSocial}
        formeJuridique={lead.formeJuridique}
        pappersData={lead.pappersData}
      />

      <LeadQualifyPanel
        leadId={lead.id}
        initial={lead.qualificationData}
      />
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#111317] border border-[#1F232B] rounded-xl p-4">
      <span className="text-[10px] font-mono text-[#9AA0A6] uppercase tracking-wider">
        {label}
      </span>
      <div className="mt-2 text-sm text-[#E8EAED]">{children}</div>
    </div>
  );
}
