export interface AppUser {
  id: string;
  email: string;
  name: string;
}

/** Utilisateur unique (mode sans authentification). */
export async function getUser(): Promise<AppUser> {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "maeva@dealradar.com",
    name: "Maeva",
  };
}
