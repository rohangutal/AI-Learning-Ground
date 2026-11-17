"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/features/study/components/upload-zone";
import { cn } from "@/lib/utils";

type TutorDocument = {
  id: string;
  filename: string;
  type: "pdf" | "docx" | "pptx";
  status: "queued" | "processing" | "ready" | "failed";
  processingError: string | null;
  sizeBytes: number;
  chunkCount: number;
  createdAt: string;
};

type TutorDocumentsProps = {
  selectedDocumentId: string | null;
  onSelectDocument: (document: Pick<TutorDocument, "id" | "filename"> | null) => void;
};

export function TutorDocuments({ selectedDocumentId, onSelectDocument }: TutorDocumentsProps) {
  const [documents, setDocuments] = useState<TutorDocument[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/tutor/documents", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not load your documents.");
    setDocuments(payload.documents);
  }, []);

  useEffect(() => {
    refresh().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load your documents."));
  }, [refresh]);

  const hasPendingDocuments = documents.some((document) => document.status === "queued" || document.status === "processing");
  useEffect(() => {
    if (!hasPendingDocuments) return;
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [hasPendingDocuments, refresh]);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/tutor/documents", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not process this document.");
      await refresh();
      onSelectDocument({ id: payload.document.id, filename: payload.document.filename });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not process this document.");
      await refresh().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (document: TutorDocument) => {
    setError(null);
    try {
      const response = await fetch(`/api/tutor/documents/${document.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not delete this document.");
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      if (selectedDocumentId === document.id) onSelectDocument(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete this document.");
    }
  };

  return (
    <section className="space-y-3" aria-label="Tutor study documents">
      <div>
        <h2 className="text-sm font-semibold">Study documents</h2>
        <p className="text-xs text-muted-foreground">Upload PDF, DOCX, or PPTX files up to 15 MB.</p>
      </div>

      <div className={cn(busy && "pointer-events-none opacity-70")}>
        <UploadZone accept=".pdf,.docx,.pptx" onUpload={upload} />
      </div>
      {busy && <p className="flex items-center gap-2 text-xs text-primary"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading and indexing your document…</p>}
      {error && <p role="alert" className="flex items-start gap-2 text-xs text-destructive"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}</p>}

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => onSelectDocument(null)}
          className={cn("w-full rounded-lg border p-2 text-left text-xs transition-colors hover:bg-muted/60", !selectedDocumentId && "border-primary bg-primary/5")}
        >
          Search all my documents
        </button>
        {documents.map((document) => {
          const isReady = document.status === "ready";
          return (
            <div key={document.id} className={cn("flex items-start gap-2 rounded-lg border p-2", selectedDocumentId === document.id && "border-primary bg-primary/5")}>
              <button
                type="button"
                disabled={!isReady}
                onClick={() => onSelectDocument({ id: document.id, filename: document.filename })}
                className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-60"
                title={document.status === "failed" ? document.processingError ?? "Indexing failed" : document.filename}
              >
                <span className="flex items-center gap-1.5 truncate text-xs font-medium"><FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />{document.filename}</span>
                <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  {isReady ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : document.status === "failed" ? <AlertCircle className="h-3 w-3 text-destructive" /> : <Loader2 className="h-3 w-3 animate-spin" />}
                  {isReady ? `Ready · ${document.chunkCount} passages` : document.status === "failed" ? "Processing failed" : "Processing"}
                </span>
                {document.status === "failed" && document.processingError && <span className="mt-1 block text-[10px] text-destructive">{document.processingError}</span>}
              </button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={`Delete ${document.filename}`} onClick={() => remove(document)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
        {documents.length === 0 && <p className="px-1 text-xs text-muted-foreground">No documents uploaded yet.</p>}
      </div>
    </section>
  );
}
