"use client";

import {
  BrainCircuit,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Upload,
  Map,
  FileCode2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    title: "AI Roadmaps",
    url: "/dashboard/roadmaps",
    icon: Map,
  },
  {
    title: "AI Cheatsheets",
    url: "/dashboard/cheatsheets",
    icon: FileCode2,
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
    title: "Exam Prep",
    url: "/dashboard/exam-prep",
    icon: ClipboardCheck,
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
      <SidebarHeader className="h-16 flex items-center px-4 pt-4 pb-3 border-b">
        <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <GraduationCap className="h-5.5 w-5.5" />
          </div>
          <span className="group-data-[collapsible=icon]:hidden bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">StudyOS</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title} className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="active-sidebar-pill"
                        className="absolute inset-y-1 inset-x-1.5 bg-gradient-to-r from-violet-500/8 to-indigo-500/8 border-l-[3px] border-violet-600 rounded-md -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      size="lg"
                      className={cn(
                        "transition-all duration-200 pl-3.5",
                        isActive 
                          ? "text-violet-600 dark:text-violet-400 font-semibold bg-transparent hover:bg-transparent"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-0.5"
                      )}
                    >
                      <Link href={item.url as never}>
                        <item.icon className={cn(
                          "h-6 w-6 transition-all duration-200",
                          isActive ? "text-violet-600 dark:text-violet-400 scale-110" : "text-slate-500 group-hover:scale-105 group-hover:-rotate-3"
                        )} />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Study Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {studyTools.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title} className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="active-sidebar-pill"
                        className="absolute inset-y-1 inset-x-1.5 bg-gradient-to-r from-violet-500/8 to-indigo-500/8 border-l-[3px] border-violet-600 rounded-md -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      size="lg"
                      className={cn(
                        "transition-all duration-200 pl-3.5",
                        isActive 
                          ? "text-violet-600 dark:text-violet-400 font-semibold bg-transparent hover:bg-transparent"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-0.5"
                      )}
                    >
                      <Link href={item.url as never}>
                        <item.icon className={cn(
                          "h-6 w-6 transition-all duration-200",
                          isActive ? "text-violet-600 dark:text-violet-400 scale-110" : "text-slate-500 group-hover:scale-105 group-hover:-rotate-3"
                        )} />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t pt-2.5">
        <SidebarMenu>
          <SidebarMenuItem className="relative">
            {pathname === "/dashboard/settings" && (
              <motion.div
                layoutId="active-sidebar-pill"
                className="absolute inset-y-1 inset-x-1.5 bg-gradient-to-r from-violet-500/8 to-indigo-500/8 border-l-[3px] border-violet-600 rounded-md -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <SidebarMenuButton 
              asChild 
              tooltip="Settings"
              size="lg"
              className={cn(
                "transition-all duration-200 pl-3.5",
                pathname === "/dashboard/settings"
                  ? "text-violet-600 dark:text-violet-400 font-semibold bg-transparent hover:bg-transparent"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-0.5"
              )}
            >
              <Link href="/dashboard/settings" as="/dashboard/settings">
                <Settings className={cn(
                  "h-6 w-6 transition-all duration-200",
                  pathname === "/dashboard/settings" ? "text-violet-600 dark:text-violet-400 scale-110" : "text-slate-500 group-hover:scale-105 group-hover:-rotate-3"
                )} />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
