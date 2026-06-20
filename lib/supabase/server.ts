import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

// Server Supabase client for Server Components, Server Actions, and Route Handlers.
// Reads/writes the auth session from cookies. In Next 16 `cookies()` is async.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // Thrown when called from a Server Component (cookies are read-only there).
            // Safe to ignore once session-refreshing middleware is added with the auth flow.
          }
        },
      },
    },
  );
}
