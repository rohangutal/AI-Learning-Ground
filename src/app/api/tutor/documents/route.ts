import { and, desc, eq, lt, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { studyDocumentChunks, studyDocuments, users } from "@/lib/db/schema";
import { chunkExtractedSections, extractStudyDocument } from "@/lib/ai/document-parser";
import { generateEmbeddings } from "@/lib/ai/embeddings";

export const runtime = "nodejs";
export const maxDuration = 60;

const STORAGE_BUCKET = "tutor-documents";
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MIME_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
} as const;

type DocumentType = keyof typeof MIME_TYPES;

function safeFilename(name: string) {
  const basename = name.split(/[\\/]/).pop() ?? "study-material";
  return basename.replace(/[\u0000-\u001f\u007f]/g, "_").slice(0, 255) || "study-material";
}

function getDocumentType(filename: string): DocumentType | null {
  const extension = filename.toLowerCase().split(".").pop();
  return extension === "pdf" || extension === "docx" || extension === "pptx" ? extension : null;
}

function hasSupportedSignature(type: DocumentType, buffer: Buffer) {
  if (type === "pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  return buffer[0] === 0x50 && buffer[1] === 0x4b;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function getStorageClient(sessionClient: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return sessionClient as unknown as SupabaseClient;
}

async function ensureTutorBucket(storageClient: SupabaseClient) {
  const { data: bucket, error } = await storageClient.storage.getBucket(STORAGE_BUCKET);
  if (bucket) return;
  if (error && !/not found|does not exist/i.test(error.message)) throw new Error("Tutor document storage is unavailable. Check Supabase configuration.");
  const { error: createError } = await storageClient.storage.createBucket(STORAGE_BUCKET, {
    public: false,
    fileSizeLimit: MAX_FILE_BYTES,
    allowedMimeTypes: Object.values(MIME_TYPES),
  });
  if (createError && !/already exists/i.test(createError.message)) throw new Error("Tutor document storage is unavailable. Check Supabase configuration.");
}

export async function GET() {
  const { user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.update(studyDocuments).set({
    status: "failed",
    processingError: "Processing did not finish. Delete the file and upload it again.",
    updatedAt: new Date(),
  }).where(and(
    eq(studyDocuments.userId, user.id),
    or(eq(studyDocuments.status, "queued"), eq(studyDocuments.status, "processing")),
    lt(studyDocuments.updatedAt, new Date(Date.now() - 15 * 60 * 1_000)),
  ));

  const documents = await db.select({
    id: studyDocuments.id,
    filename: studyDocuments.filename,
    type: studyDocuments.type,
    status: studyDocuments.status,
    processingError: studyDocuments.processingError,
    sizeBytes: studyDocuments.sizeBytes,
    chunkCount: studyDocuments.chunkCount,
    createdAt: studyDocuments.createdAt,
  }).from(studyDocuments)
    .where(eq(studyDocuments.userId, user.id))
    .orderBy(desc(studyDocuments.createdAt));

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_FILE_BYTES + 256 * 1024) {
    return NextResponse.json({ error: "File exceeds the 15 MB upload limit." }, { status: 413 });
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const storageClient = getStorageClient(supabase);

  let file: File;
  try {
    const form = await request.formData();
    const value = form.get("file");
    if (!(value instanceof File)) return NextResponse.json({ error: "Choose a PDF, DOCX, or PPTX file." }, { status: 400 });
    file = value;
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }

  const filename = safeFilename(file.name);
  const type = getDocumentType(filename);
  if (!type) return NextResponse.json({ error: "Only PDF, DOCX, and PPTX files are supported." }, { status: 415 });
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File must be between 1 byte and 15 MB." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasSupportedSignature(type, buffer)) {
    return NextResponse.json({ error: "The file contents do not match its extension." }, { status: 415 });
  }

  let documentId: string | null = null;
  let storagePath: string | null = null;
  try {
    await ensureTutorBucket(storageClient);
    await db.insert(users).values({
      id: user.id,
      email: user.email ?? `${user.id}@users.invalid`,
      fullName: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Student",
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    }).onConflictDoNothing();

    const [document] = await db.insert(studyDocuments).values({
      userId: user.id,
      filename,
      storagePath: `${user.id}/pending/${crypto.randomUUID()}/${filename}`,
      mimeType: MIME_TYPES[type],
      sizeBytes: file.size,
      type,
      status: "queued",
    }).returning();
    documentId = document.id;

    storagePath = `${user.id}/${document.id}/${filename}`;
    await db.update(studyDocuments).set({ storagePath, status: "processing", updatedAt: new Date() })
      .where(and(eq(studyDocuments.id, document.id), eq(studyDocuments.userId, user.id)));

    const { error: storageError } = await storageClient.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
      contentType: MIME_TYPES[type],
      upsert: false,
    });
    if (storageError) throw new Error("Could not store the file. Check the private tutor-documents bucket and its user-folder policies.");

    const sections = await extractStudyDocument(buffer, type);
    const chunks = chunkExtractedSections(sections);
    if (chunks.length === 0) throw new Error("No readable text was found. Scanned documents may need OCR before they can be used.");

    for (let offset = 0; offset < chunks.length; offset += 32) {
      const batch = chunks.slice(offset, offset + 32);
      const embeddings = await generateEmbeddings(batch.map((chunk) => chunk.text));
      await db.insert(studyDocumentChunks).values(batch.map((chunk, index) => ({
        documentId: document.id,
        userId: user.id,
        chunkIndex: offset + index,
        content: chunk.text,
        pageNumber: chunk.pageNumber ?? null,
        slideNumber: chunk.slideNumber ?? null,
        section: chunk.section ?? null,
        embedding: embeddings[index],
      })));
    }

    const [readyDocument] = await db.update(studyDocuments).set({
      status: "ready",
      chunkCount: chunks.length,
      processingError: null,
      updatedAt: new Date(),
    }).where(and(eq(studyDocuments.id, document.id), eq(studyDocuments.userId, user.id))).returning({
      id: studyDocuments.id,
      filename: studyDocuments.filename,
      type: studyDocuments.type,
      status: studyDocuments.status,
      sizeBytes: studyDocuments.sizeBytes,
      chunkCount: studyDocuments.chunkCount,
      createdAt: studyDocuments.createdAt,
    });

    return NextResponse.json({ document: readyDocument }, { status: 201 });
  } catch (error) {
    console.error("[Tutor document ingestion] Failed to process an upload", error instanceof Error ? error.name : "UnknownError");
    const safeErrors = new Set([
      "Could not store the file. Check the private tutor-documents bucket and its user-folder policies.",
      "No readable text was found. Scanned documents may need OCR before they can be used.",
      "This document contains too much extractable text. Try a smaller file.",
      "This document is too large to index in one request. Try a smaller file.",
      "No presentation slides were found in this PPTX file.",
    ]);
    const rawMessage = error instanceof Error ? error.message : "";
    const message = safeErrors.has(rawMessage)
      ? rawMessage
      : /relation .*study_documents|study_document_chunks.*does not exist/i.test(rawMessage)
        ? "The tutor database tables are not ready. Run npm run db:migrate, then try again."
        : /OPENROUTER_API_KEY|Embeddings API failed|Invalid response format from embeddings/i.test(rawMessage)
          ? "The AI embedding service is not configured correctly. Check OPENROUTER_API_KEY and try again."
          : /bucket|storage/i.test(rawMessage)
            ? "Tutor document storage is unavailable. Run supabase/storage-setup.sql or check the Supabase service key."
            : "Could not process this document. Check that it is a valid, text-readable file and try again.";

    if (documentId) {
      await db.delete(studyDocumentChunks).where(and(eq(studyDocumentChunks.documentId, documentId), eq(studyDocumentChunks.userId, user.id))).catch(() => undefined);
      await db.update(studyDocuments).set({ status: "failed", processingError: message, updatedAt: new Date() })
        .where(and(eq(studyDocuments.id, documentId), eq(studyDocuments.userId, user.id))).catch(() => undefined);
    }
    if (storagePath) {
      const storageClient = getStorageClient(supabase);
      await storageClient.storage.from(STORAGE_BUCKET).remove([storagePath]).catch(() => undefined);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
