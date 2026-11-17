"use client";

import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload?: (file: File) => void;
  accept?: string;
}

export function UploadZone({ onUpload, accept = ".pdf" }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload?.(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed transition-all cursor-pointer bg-muted/10",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 rounded-full bg-primary/10 p-3">
          <UploadCloud className="h-6 w-6 text-primary" />
        </div>
        <p className="mb-1 text-sm font-medium">Click or drag a file here</p>
        <p className="text-xs text-muted-foreground">PDF, DOCX, or PPTX · up to 15 MB</p>
      </div>
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        accept={accept}
        aria-label="Choose a study document to upload"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onUpload?.(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
