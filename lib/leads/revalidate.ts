import { revalidatePath } from "next/cache";

export function revalidateLeadsViews() {
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
  revalidatePath("/governance");
}
