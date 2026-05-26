import { getUser, type AppUser } from "./get-user";

export type User = AppUser;

export async function auth(): Promise<{ user: User }> {
  const user = await getUser();
  return { user };
}

export { getUser, type AppUser };
