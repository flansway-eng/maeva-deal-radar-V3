import { revalidatePath } from "next/cache";
import { PIPELINE_REVALIDATE_PATHS } from "./types";

export function revalidatePipelineViews() {
  for (const path of PIPELINE_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  revalidatePath("/messages", "layout");
}
