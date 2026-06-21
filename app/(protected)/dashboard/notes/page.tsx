"use client";

import { Editor } from "@/features/notes/components/editor";
import { FadeIn } from "@/components/ui/animations";

export default function NotesPage() {
  return (
    <FadeIn>
      <Editor />
    </FadeIn>
  );
}
