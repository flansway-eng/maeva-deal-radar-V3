import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authorizeCron } from "@/lib/cron/authorize";
import { fetchBodaccSignals } from "@/lib/sources/bodacc";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await fetchBodaccSignals();
    revalidatePath("/");
    return NextResponse.json({ ok: true, inserted: count, source: "BODACC" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "BODACC failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
