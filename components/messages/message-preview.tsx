import type { TaskChannel } from "@/lib/db/queries/tasks";

interface MessagePreviewProps {
  channel: TaskChannel;
  company: string;
  contactName: string | null;
  subject: string | null;
  body: string;
}

export function MessagePreview({
  channel,
  company,
  contactName,
  subject,
  body,
}: MessagePreviewProps) {
  const isEmail = channel === "EMAIL";

  if (isEmail) {
    return (
      <div className="rounded-xl border border-[#1F232B] bg-[#0A0B0D] overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-[#1F232B] bg-[#16191F] space-y-2">
          <div className="flex gap-2 text-[10px] font-mono">
            <span className="text-[#9AA0A6] w-12">De</span>
            <span className="text-[#E8EAED]">maeva@dealradar.internal</span>
          </div>
          <div className="flex gap-2 text-[10px] font-mono">
            <span className="text-[#9AA0A6] w-12">À</span>
            <span className="text-[#E8EAED]">
              {contactName ?? "contact"} @ {company}
            </span>
          </div>
          <div className="flex gap-2 text-[10px] font-mono">
            <span className="text-[#9AA0A6] w-12">Objet</span>
            <span className="text-[#E8EAED] font-semibold">
              {subject || "(sans objet)"}
            </span>
          </div>
        </div>
        <div className="p-4 text-sm text-[#E8EAED] whitespace-pre-wrap leading-relaxed min-h-[200px]">
          {body || (
            <span className="text-[#9AA0A6]/40 italic">Aperçu vide…</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1F232B] bg-[#0A0B0D] overflow-hidden">
      <div className="px-4 py-3 bg-[#0A66C2]/10 border-b border-[#0A66C2]/20 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[#0A66C2]/30 flex items-center justify-center text-xs font-bold text-[#0A66C2]">
          in
        </span>
        <div>
          <p className="text-xs font-bold text-[#E8EAED]">Message LinkedIn</p>
          <p className="text-[10px] text-[#9AA0A6]">
            {contactName ?? "Contact"} · {company}
          </p>
        </div>
      </div>
      <div className="p-4 text-sm text-[#E8EAED] whitespace-pre-wrap leading-relaxed min-h-[200px]">
        {body || <span className="text-[#9AA0A6]/40 italic">Aperçu vide…</span>}
      </div>
    </div>
  );
}
