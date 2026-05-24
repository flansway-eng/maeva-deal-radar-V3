import { describe, expect, it } from "vitest";
import { z } from "zod";

const markSchema = z.object({
  taskId: z.string().min(1),
  note: z.string().max(500).optional(),
});

const postponeSchema = z.object({
  taskId: z.string().min(1),
  newPlannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(500).optional(),
});

describe("server action schemas", () => {
  it("accepts fixture task ids", () => {
    expect(
      markSchema.safeParse({
        taskId: "f1000000-0000-0000-0000-000000000001",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid postpone date", () => {
    expect(
      postponeSchema.safeParse({
        taskId: "f1000000-0000-0000-0000-000000000001",
        newPlannedDate: "23/05/2026",
      }).success,
    ).toBe(false);
  });

  it("accepts ISO postpone date", () => {
    expect(
      postponeSchema.safeParse({
        taskId: "f1000000-0000-0000-0000-000000000001",
        newPlannedDate: "2026-06-01",
      }).success,
    ).toBe(true);
  });
});
