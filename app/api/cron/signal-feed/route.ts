import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authorizeCron } from "@/lib/cron/authorize";
import { runSignalFeedJob } from "@/lib/signals/run-signal-feed";

export const runtime = "nodejs";

/** @deprecated Utiliser /api/cron/signal-tavily */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await runSignalFeedJob();
  revalidatePath("/");
  return NextResponse.json({ ok: true, inserted: count, source: "TAVILY" });
}
