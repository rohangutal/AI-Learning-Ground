"use client";

import { AiChat } from "@/features/study/components/ai-chat";
import { FadeIn } from "@/components/ui/animations";
import { TutorDocuments } from "@/features/study/components/tutor-documents";
import { useState } from "react";

export default function TutorPage() {
  const [selectedDocument, setSelectedDocument] = useState<{ id: string; filename: string } | null>(null);

  return (
    <FadeIn>
      <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-8rem)]">
        <div className="lg:col-span-1 space-y-6 flex flex-col overflow-y-auto pr-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">AI Tutor</h1>
            <p className="text-sm text-muted-foreground">Upload your study material, then ask questions and get answers grounded in your document.</p>
          </div>

          <div className="flex-1 shrink-0">
            <TutorDocuments selectedDocumentId={selectedDocument?.id ?? null} onSelectDocument={setSelectedDocument} />
          </div>
        </div>
        <div className="lg:col-span-2 h-full">
          <AiChat selectedDocumentId={selectedDocument?.id ?? null} selectedDocumentName={selectedDocument?.filename ?? null} />
        </div>
      </div>
    </FadeIn>
  );
}
