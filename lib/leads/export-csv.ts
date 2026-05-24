import type { FixtureLead } from "@/lib/db/queries/governance-fixture";

export function exportLeadsToCsv(
  rows: FixtureLead[],
  filename = "shortlist.csv",
) {
  const headers = [
    "company",
    "track",
    "review_status",
    "confidence",
    "website",
    "target_role",
    "signal",
  ];

  const escapeCsvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

  const lines = [
    headers.join(","),
    ...rows.map((l) =>
      [
        l.companyName,
        l.track,
        l.reviewStatus,
        l.confidenceScore ?? "",
        l.website ?? "",
        l.targetRole ?? "",
        l.primarySignal ?? "",
      ]
        .map((c) => escapeCsvCell(String(c)))
        .join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
