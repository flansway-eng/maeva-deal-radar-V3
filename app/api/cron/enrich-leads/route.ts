import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron/authorize";
import { enrichPendingLeads } from "@/lib/sources/pappers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await enrichPendingLeads();
  return NextResponse.json({ ok: true, enriched: count });
}
