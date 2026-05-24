import { createClient } from "./server";

export interface User {
  id: string;
  email?: string;
}

export async function auth(): Promise<{ user: User | null }> {
  // If Supabase environment is not set up, provide a fallback "Maeva" user so developers can log in and test Phase 0
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return {
      user: {
        id: "00000000-0000-0000-0000-000000000000",
        email: "maeva@dealradar.internal",
      },
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null };
    }

    return { user: { id: user.id, email: user.email } };
  } catch (err) {
    console.error("Error fetching user from Supabase auth:", err);
    return { user: null };
  }
}
