"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAppStore } from "@/store/use-app-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, BookOpen, Edit2, Check } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { currentTopic, setCurrentTopic } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [topicInput, setTopicInput] = useState("");

  // Initialize store from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("study_current_topic");
      if (saved) {
        setCurrentTopic(saved);
      }
    }
  }, [setCurrentTopic]);

  useEffect(() => {
    setTopicInput(currentTopic);
  }, [currentTopic]);

  const currentPath = pathname.split("/").filter(Boolean).pop();
  const title = currentPath 
    ? currentPath.charAt(0).toUpperCase() + currentPath.slice(1) 
    : "Dashboard";

  const handleSave = () => {
    setCurrentTopic(topicInput.trim());
    setIsEditing(false);
  };

  const handleClear = () => {
    setCurrentTopic("");
    setTopicInput("");
    setIsEditing(false);
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 bg-background/80 backdrop-blur border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium hidden sm:block">{title}</h1>
      </div>

      {/* Center Topic Coordinator Widget */}
      <div className="flex-1 flex justify-center max-w-md mx-auto">
        {isEditing ? (
          <div className="flex items-center gap-1.5 w-full">
            <Input
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Enter focus topic (e.g. React Hooks)"
              className="h-8 text-xs bg-muted/40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setIsEditing(false);
              }}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-green-600 dark:text-green-500" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center">
            {currentTopic ? (
              <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-full pl-3 pr-1 py-0.5 text-xs text-primary transition-all shadow-sm">
                <BookOpen className="h-3 w-3 shrink-0" />
                <span className="font-semibold truncate max-w-[120px] sm:max-w-[180px]">
                  Focus: {currentTopic}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 rounded-full hover:bg-primary/20 text-primary shrink-0 ml-1"
                  onClick={() => setIsEditing(true)}
                  title="Edit topic"
                >
                  <Edit2 className="h-2.5 w-2.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 rounded-full hover:bg-primary/20 text-primary shrink-0"
                  onClick={handleClear}
                  title="Clear topic"
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] rounded-full border-dashed px-3 flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditing(true)}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Set Study Topic
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
