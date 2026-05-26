import { getUser, type AuthUser } from "./server";

export type User = AuthUser;

export async function auth(): Promise<{ user: User | null }> {
  const user = await getUser();
  return { user };
}
