import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  // If a mock session cookie is set, return a mock client to bypass external Supabase API
  const mockSessionCookie = cookieStore.get("sb-mock-session")?.value;
  if (mockSessionCookie) {
    try {
      const mockSession = JSON.parse(mockSessionCookie);
      const mockUser = mockSession.user;
      return {
        auth: {
          getUser: async () => {
            return { data: { user: mockUser }, error: null };
          },
          getSession: async () => {
            return { data: { session: mockSession }, error: null };
          },
          signOut: async () => {
            try {
              cookieStore.delete("sb-mock-session");
            } catch (e) {
              // Ignore cookie delete errors if called in non-action context
            }
            return { error: null };
          },
        },
      } as any;
    } catch (e) {
      console.error("Failed to parse mock session cookie on server:", e);
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

