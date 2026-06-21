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
        "relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed transition-all cursor-pointer bg-muted/10",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <UploadCloud className="h-8 w-8 text-primary" />
        </div>
        <p className="mb-2 text-lg font-medium">Click or drag file to this area to upload</p>
        <p className="text-sm text-muted-foreground">Support for a single or bulk upload. Strictly prohibited from uploading company data or other banned files.</p>
      </div>
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        accept={accept}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onUpload?.(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
