import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <Skeleton className="h-8 w-56" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </main>
  );
}
