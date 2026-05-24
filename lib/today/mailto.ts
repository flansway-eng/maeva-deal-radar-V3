import type { FixtureTask } from "@/lib/db/queries/tasks";

export function buildMailtoUrl(task: FixtureTask): string {
  const params = new URLSearchParams();
  if (task.messageSubject) params.set("subject", task.messageSubject);
  if (task.messageBody) params.set("body", task.messageBody);
  const qs = params.toString();
  return qs ? `mailto:?${qs}` : "mailto:";
}

export function buildGmailComposeUrl(task: FixtureTask): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
  });
  if (task.messageSubject) params.set("su", task.messageSubject);
  if (task.messageBody) params.set("body", task.messageBody);
  return `https://mail.google.com/mail/?${params.toString()}`;
}
