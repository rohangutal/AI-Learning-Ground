"use client";

import Link from "next/link";
import { GraduationCap, ArrowLeft, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/actions/auth";
import { useTransition, useState } from "react";
import { FadeIn } from "@/components/ui/animations";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await forgotPassword(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(true);
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
            <h1 className="text-2xl font-bold tracking-tight">
              {success ? "Check your email" : "Reset password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {success
                ? "We've sent a recovery link to your email address."
                : "Enter your email address and we'll send you a recovery link"}
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            {success ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MailOpen className="h-8 w-8 animate-bounce" />
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Please click the link in the email to set a new password. If you don&apos;t see it, check your spam folder.
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to sign in
                  </Link>
                </Button>
              </div>
            ) : (
              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Sending reset link..." : "Send Reset Link"}
                </Button>
                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
