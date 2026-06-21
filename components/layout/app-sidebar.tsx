"use client";

import {
  BookOpen,
  BrainCircuit,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// Menu items
const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "All Notes",
    url: "/dashboard/notes",
    icon: FileText,
  },
  {
    title: "AI Notes Generator",
    url: "/dashboard/notes/generate",
    icon: Sparkles,
  },
];

const studyTools = [
  {
    title: "AI Chat Tutor",
    url: "/dashboard/tutor",
    icon: MessageSquare,
  },
  {
    title: "Flashcards",
    url: "/dashboard/flashcards",
    icon: BrainCircuit,
  },
  {
    title: "Quizzes",
    url: "/dashboard/quizzes",
    icon: GraduationCap,
  },
  {
    title: "Uploads",
    url: "/dashboard/uploads",
    icon: Upload,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="h-14 flex items-center px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="group-data-[collapsible=icon]:hidden">StudyOS</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url as any}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Study Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studyTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url as any}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/dashboard/settings" as="/dashboard/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
