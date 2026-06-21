"use client";

import { AiChat } from "@/features/study/components/ai-chat";
import { FadeIn } from "@/components/ui/animations";
import { UploadZone } from "@/features/study/components/upload-zone";

export default function TutorPage() {
  return (
    <FadeIn>
      <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-8rem)]">
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">AI Tutor</h1>
            <p className="text-sm text-muted-foreground">
              Upload your study materials or select an existing note, and ask your tutor to explain concepts, generate quizzes, or summarize the content.
            </p>
          </div>
          <UploadZone />
        </div>
        <div className="lg:col-span-2 h-full">
          <AiChat />
        </div>
      </div>
    </FadeIn>
  );
}
