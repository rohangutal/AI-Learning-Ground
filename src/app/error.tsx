"use client";

import { PageState } from "@/components/feedback/page-state";

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16">
      <PageState
        title="Something went wrong"
        description="The page could not finish loading. Please try again."
        action={{ label: "Try again", onClick: reset }}
      />
    </main>
  );
}
