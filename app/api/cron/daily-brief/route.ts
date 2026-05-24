import { NextResponse } from "next/server";
import { runDailyBriefJob } from "@/lib/brief/run-daily-brief";

export const runtime = "nodejs";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brief = await runDailyBriefJob();
  return NextResponse.json({
    ok: true,
    briefDate: brief.briefDate,
    generatedAt: brief.generatedAt,
  });
}
