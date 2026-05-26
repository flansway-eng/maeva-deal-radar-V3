"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function devLogin() {
  if (process.env.NODE_ENV !== "development") return;

  const cookieStore = await cookies();
  cookieStore.set("dev-session", "maeva@dealradar.com", {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/");
}
