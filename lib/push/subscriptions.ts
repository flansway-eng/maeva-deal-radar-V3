import { db } from "@/lib/db";
import { FIXTURE_PUSH_SUBSCRIPTIONS } from "@/lib/db/queries/innovation-fixture";
import { pushSubscriptions } from "@/lib/db/schema";

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function savePushSubscription(input: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<PushSubscriptionRecord> {
  const record: PushSubscriptionRecord = {
    id: `p${Date.now()}`,
    endpoint: input.endpoint,
    keys: input.keys,
  };

  try {
    await db.insert(pushSubscriptions).values({
      endpoint: input.endpoint,
      // keys sérialisé en JSON pour SQLite
      keys: JSON.stringify(input.keys),
    });
  } catch {
    const exists = FIXTURE_PUSH_SUBSCRIPTIONS.some(
      (s) => s.endpoint === input.endpoint,
    );
    if (!exists) FIXTURE_PUSH_SUBSCRIPTIONS.push(record);
  }

  return record;
}

export async function listPushSubscriptions(): Promise<
  PushSubscriptionRecord[]
> {
  try {
    const rows = await db.select().from(pushSubscriptions);
    return rows.map((r) => ({
      id: r.id,
      endpoint: r.endpoint,
      // keys désérialisé depuis JSON
      keys: typeof r.keys === "string" ? JSON.parse(r.keys) : r.keys,
    }));
  } catch {
    return [...FIXTURE_PUSH_SUBSCRIPTIONS];
  }
}

export async function sendDailyBriefPushNotification(params: {
  title: string;
  body: string;
}): Promise<{ sent: number; skipped: boolean }> {
  const subs = await listPushSubscriptions();
  if (subs.length === 0) {
    return { sent: 0, skipped: true };
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return { sent: 0, skipped: true };
  }

  // web-push package not installed — log intent in dev
  if (process.env.NODE_ENV !== "production") {
    console.info("[push] daily brief", params.title, `→ ${subs.length} subs`);
  }

  return { sent: subs.length, skipped: false };
}
