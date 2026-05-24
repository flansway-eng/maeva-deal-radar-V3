import { NextResponse } from "next/server";
import { z } from "zod";
import { savePushSubscription } from "@/lib/push/subscriptions";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const sub = await savePushSubscription(parsed.data);
  return NextResponse.json({ ok: true, id: sub.id });
}
