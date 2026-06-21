import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight">StudyOS</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            The next-generation AI learning platform designed for ambitious students.
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4">Product</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
            <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link href="#" className="hover:text-foreground">Changelog</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4">Legal</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 mt-12 pt-8 border-t text-sm text-muted-foreground flex justify-between">
        <p>© 2026 StudyOS. All rights reserved.</p>
      </div>
    </footer>
  );
}
