"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { cookies } from "next/headers";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    }
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is off, the user is signed in immediately
  if (data?.user) {
    const existingUser = await db.select().from(users).where(eq(users.id, data.user.id)).limit(1);
    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: data.user.id,
        email: data.user.email!,
        fullName: fullName || data.user.user_metadata?.full_name || "",
        avatarUrl: data.user.user_metadata?.avatar_url || "",
      });
    }
  }

  // Depending on email confirmation settings, we might redirect to a 'check email' page
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("sb-mock-session");

  const supabase = await createClient();
  await supabase.auth.signOut();
  
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function loginBypass() {
  const cookieStore = await cookies();
  
  // Define a static demo user id
  const demoUserId = "d3b07384-d113-4ec5-a5ae-be29c782098d";
  const demoEmail = "demo@example.com";
  const demoName = "Demo User";

  // Upsert the demo user in PostgreSQL via Drizzle
  try {
    await db.insert(users).values({
      id: demoUserId,
      email: demoEmail,
      fullName: demoName,
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=demo",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        email: demoEmail,
        fullName: demoName,
        updatedAt: new Date(),
      }
    });
  } catch (dbError) {
    console.error("Failed to insert/upsert demo user in DB:", dbError);
  }

  // Set the mock session cookie
  const mockSession = {
    user: {
      id: demoUserId,
      email: demoEmail,
      user_metadata: {
        full_name: demoName,
        avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=demo",
      },
      role: "authenticated",
      aud: "authenticated",
    },
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
  };

  cookieStore.set("sb-mock-session", JSON.stringify(mockSession), {
    path: "/",
    httpOnly: false, // client needs to read it in client.ts
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInWithProvider(provider: "google" | "github") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    return { url: data.url };
  }
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

