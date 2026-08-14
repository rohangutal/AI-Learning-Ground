"use client";

import { FadeIn, SlideUp } from "@/components/ui/animations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export default function UploadsPage() {
  const mockUploads = [
    {
      id: "1",
      filename: "machine-learning-syllabus.pdf",
      size: "2.4 MB",
      date: "2 days ago",
      status: "processed",
    },
    {
      id: "2",
      filename: "data-structures-notes.pdf",
      size: "4.8 MB",
      date: "5 days ago",
      status: "processed",
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      <FadeIn>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Upload Documents</h1>
            <p className="text-muted-foreground">Upload and manage PDFs, slides, and study material to generate AI study guides.</p>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-3">
        <SlideUp delay={0.1} className="md:col-span-2 space-y-6">
          {/* Upload Drag & Drop Area */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <UploadCloud className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground">PDF, JPEG, or PNG up to 10MB</p>
              </div>
              <Button size="sm">Select File</Button>
            </CardContent>
          </Card>

          {/* Files List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Your Study Materials
              </CardTitle>
              <CardDescription>Documents you have uploaded to your AI workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockUploads.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No files uploaded yet. Upload a document above to get started.
                </div>
              ) : (
                mockUploads.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2 text-foreground">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm line-clamp-1">{file.filename}</h3>
                        <p className="text-xs text-muted-foreground">{file.size} • {file.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Processed
                      </span>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </SlideUp>

        <SlideUp delay={0.2}>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Upload Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                To get the best quality AI summaries, flashcards, and tutor chat, make sure your PDFs:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Are cleanly formatted text, not scanned images (OCR recommended)</li>
                <li>Focus on academic topics, lectures, or syllabus documents</li>
                <li>Do not contain restricted or private information</li>
              </ul>
              <p className="pt-2 border-t text-xs">
                Upload capacity is managed in accordance with your subscription tier.
              </p>
            </CardContent>
          </Card>
        </SlideUp>
      </div>
    </div>
  );
}
