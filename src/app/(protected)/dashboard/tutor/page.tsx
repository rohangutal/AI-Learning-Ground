"use client";

import { AiChat } from "@/features/study/components/ai-chat";
import { FadeIn } from "@/components/ui/animations";
import { UploadZone } from "@/features/study/components/upload-zone";
import { useAppStore } from "@/store/use-app-store";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function TutorPage() {
  const { currentTopic, setCurrentTopic } = useAppStore();
  const [topic, setTopic] = useState("");

  useEffect(() => {
    setTopic(currentTopic);
  }, [currentTopic]);

  const handleUpdateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentTopic(topic.trim());
  };

  return (
    <FadeIn>
      <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-8rem)]">
        <div className="lg:col-span-1 space-y-6 flex flex-col overflow-y-auto pr-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">AI Tutor</h1>
            <p className="text-sm text-muted-foreground">
              Ask your tutor to explain concepts, give analogies, or summarize content. Your active topic will coordinate across study tools.
            </p>
          </div>

          {/* Topic Coordinator Card */}
          <Card className="border shadow-sm shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Active Study Topic
              </CardTitle>
              <CardDescription className="text-xs">
                Set the active topic to align flashcards, quizzes, and chat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateTopic} className="space-y-3">
                <div className="space-y-1">
                  <Input
                    placeholder="e.g. React hooks, machine learning"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
                <Button type="submit" className="w-full text-xs h-9">
                  Update Active Topic
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex-1 shrink-0">
            <UploadZone />
          </div>
        </div>
        <div className="lg:col-span-2 h-full">
          <AiChat key={currentTopic} />
        </div>
      </div>
    </FadeIn>
  );
}
