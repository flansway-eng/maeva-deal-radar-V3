import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron/authorize";
import { generateEmbeddingsBatch } from "@/lib/ai/embeddings";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await generateEmbeddingsBatch();
  return NextResponse.json({ ok: true, embedded: count });
}
