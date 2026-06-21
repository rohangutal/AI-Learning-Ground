"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signInWithProvider } from "@/lib/actions/auth";
import { useTransition, useState } from "react";
import { FadeIn, SlideUp } from "@/components/ui/animations";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleProviderSignIn = (provider: "google" | "github") => {
    setError(null);
    startTransition(async () => {
      const result = await signInWithProvider(provider);
      if (result?.error) {
        setError(result.error);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <FadeIn>
        <div className="w-full max-w-md space-y-8 bg-background p-8 rounded-2xl border shadow-sm">
          <div className="flex flex-col items-center text-center space-y-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-6 w-6" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to sign in to your account
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            <form action={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={() => handleProviderSignIn("github")}
                disabled={isPending}
              >
                GitHub
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={() => handleProviderSignIn("google")}
                disabled={isPending}
              >
                Google
              </Button>
            </div>
          </div>

          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
