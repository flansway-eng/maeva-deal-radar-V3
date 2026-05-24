export type ActionResult =
  | { ok: true; taskId?: string; company?: string }
  | { ok: false; error: string };

export const PIPELINE_REVALIDATE_PATHS = [
  "/pipeline",
  "/today",
  "/journal",
  "/",
  "/governance",
  "/governance/review",
  "/governance/normalize",
  "/governance/quality-audit",
  "/messages",
] as const;
