"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface EditorProps {
  initialTitle?: string;
  initialContent?: string;
  onSave?: (title: string, content: string) => void;
}

export function Editor({ initialTitle = "", initialContent = "", onSave }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <input
        type="text"
        placeholder="Untitled"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/30 mb-8"
      />
      <textarea
        ref={textareaRef}
        placeholder="Start writing your notes..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={cn(
          "w-full resize-none bg-transparent text-lg outline-none placeholder:text-muted-foreground/50",
          "min-h-[500px] leading-relaxed"
        )}
      />
    </div>
  );
}
