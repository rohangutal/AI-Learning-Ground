"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const pathname = usePathname();
  
  // Quick hack for breadcrumb formatting, in a real app use a map or router structure
  const currentPath = pathname.split("/").filter(Boolean).pop();
  const title = currentPath 
    ? currentPath.charAt(0).toUpperCase() + currentPath.slice(1) 
    : "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background/80 backdrop-blur border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-sm font-medium">{title}</h1>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {/* User dropdown would go here */}
      </div>
    </header>
  );
}
