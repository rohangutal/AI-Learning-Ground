import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { studyDocuments } from "@/lib/db/schema";

const STORAGE_BUCKET = "tutor-documents";

export async function DELETE(_request: Request, context: { params: Promise<{ documentId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await context.params;
  const [document] = await db.select({ id: studyDocuments.id, storagePath: studyDocuments.storagePath })
    .from(studyDocuments)
    .where(and(eq(studyDocuments.id, documentId), eq(studyDocuments.userId, user.id)))
    .limit(1);
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? createSupabaseAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
    : supabase as unknown as SupabaseClient;
  const { error: storageError } = await storageClient.storage.from(STORAGE_BUCKET).remove([document.storagePath]);
  if (storageError) {
    console.error("[Tutor document deletion] Storage removal failed", storageError.name);
    return NextResponse.json({ error: "Could not delete the stored file. Please try again." }, { status: 502 });
  }

  await db.delete(studyDocuments).where(and(eq(studyDocuments.id, document.id), eq(studyDocuments.userId, user.id)));
  return NextResponse.json({ success: true });
}
