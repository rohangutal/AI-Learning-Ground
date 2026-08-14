import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        acc[name] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const mockSessionCookie = cookies["sb-mock-session"];
    if (mockSessionCookie) {
      try {
        const mockSession = JSON.parse(decodeURIComponent(mockSessionCookie));
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
              document.cookie = "sb-mock-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
              return { error: null };
            },
          },
        } as any;
      } catch (e) {
        console.error("Failed to parse mock session on client:", e);
      }
    }
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

