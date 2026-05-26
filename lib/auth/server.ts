import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface AuthUser {
  id: string;
  email?: string;
}

const DEV_SESSION_COOKIE = "dev-session";
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase env variables are missing. Using mock/stub settings.",
    );
    return createServerClient(
      "https://placeholder-project.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder",
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      },
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Ignored if called from a Server Component.
        }
      },
    },
  });
}

export async function getUser(): Promise<AuthUser | null> {
  if (process.env.NODE_ENV === "development") {
    const cookieStore = await cookies();
    const devEmail = cookieStore.get(DEV_SESSION_COOKIE)?.value;
    if (devEmail) {
      return { id: DEV_USER_ID, email: devEmail };
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return { id: user.id, email: user.email };
  } catch (err) {
    console.error("Error fetching user from Supabase auth:", err);
    return null;
  }
}
