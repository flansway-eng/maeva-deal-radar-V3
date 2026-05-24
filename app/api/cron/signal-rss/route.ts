import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authorizeCron } from "@/lib/cron/authorize";
import { fetchRssSignals } from "@/lib/sources/rss-feeds";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await fetchRssSignals();
  revalidatePath("/");
  return NextResponse.json({ ok: true, inserted: count, source: "RSS" });
}
