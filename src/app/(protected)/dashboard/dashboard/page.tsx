import Link from "next/link";

const dashboardSections = [
  { href: "/dashboard/notes", label: "Notes" },
  { href: "/dashboard/flashcards", label: "Flashcards" },
  { href: "/dashboard/quizzes", label: "Quizzes" },
  { href: "/dashboard/uploads", label: "Uploads" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-primary">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Learning workspace
        </h1>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dashboardSections.map((section) => (
          <Link
            key={section.href}
            href={section.href as any}
            className="rounded-lg border bg-card p-5 text-card-foreground transition hover:border-primary"
          >
            <span className="text-sm font-medium">{section.label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
