import type { Metadata } from "next";
import Link from "next/link";
import { ReviewQueueClient } from "@/components/governance/review-queue-client";
import {
  getCompanyAliasesList,
  getPendingReviewQueue,
} from "@/lib/db/queries/governance";

export const metadata: Metadata = {
  title: "Review Queue — Gouvernance",
};

export default async function ReviewQueuePage() {
  const [rows, aliases] = await Promise.all([
    getPendingReviewQueue(),
    getCompanyAliasesList(),
  ]);

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
          Review Queue
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1">
          Décisions en attente · Application batch · Preview source lazy
        </p>
      </div>

      <ReviewQueueClient rows={rows} aliases={aliases} />
    </div>
  );
}
