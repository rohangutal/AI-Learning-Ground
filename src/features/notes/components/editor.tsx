"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface EditorProps {
  initialTitle?: string;
  initialContent?: string;
  onSave?: (title: string, content: string) => void | Promise<void>;
}

export function Editor({ initialTitle = "", initialContent = "", onSave }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSaved, setLastSaved] = useState({ title: initialTitle, content: initialContent });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if initial values change (e.g. when loading finishes)
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    setLastSaved({ title: initialTitle, content: initialContent });
  }, [initialTitle, initialContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Autosave logic
  useEffect(() => {
    if (title === lastSaved.title && content === lastSaved.content) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("unsaved");

    const timer = setTimeout(async () => {
      if (onSave) {
        setSaveStatus("saving");
        try {
          await onSave(title, content);
          setLastSaved({ title, content });
          setSaveStatus("saved");
        } catch (e) {
          console.error("Autosave failed:", e);
          setSaveStatus("unsaved");
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [title, content, onSave, lastSaved]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 relative">
      <div className="absolute top-4 right-6 text-xs text-muted-foreground font-medium flex items-center gap-1.5 select-none">
        {saveStatus === "saved" && (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Saved to Cloud</span>
          </>
        )}
        {saveStatus === "saving" && (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
            <span className="text-blue-500 font-medium">Saving...</span>
          </>
        )}
        {saveStatus === "unsaved" && (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-amber-500">Unsaved changes</span>
          </>
        )}
      </div>

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

