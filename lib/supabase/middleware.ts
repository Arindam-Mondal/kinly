import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/types/database";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
const PROTECTED_ROUTES = ["/home", "/calendar", "/insights", "/notes", "/settings", "/onboarding"];

// Refreshes the auth session on every request and gates routes. Based on the
// @supabase/ssr middleware pattern — do not add logic between createServerClient
// and getUser(), or sessions can get stuck.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const onAuthRoute = AUTH_ROUTES.some((r) => path.startsWith(r));
  const onProtectedRoute = PROTECTED_ROUTES.some((r) => path.startsWith(r));

  if (!user && onProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && onAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return response;
}
