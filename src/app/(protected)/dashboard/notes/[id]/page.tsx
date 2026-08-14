"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BrainCircuit, GraduationCap, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Editor } from "@/features/notes/components/editor";
import { getNoteById, updateNoteAction, deleteNoteAction } from "@/lib/actions/notes";
import { generateFlashcardsFromNoteAction } from "@/lib/actions/flashcards";
import { generateQuizFromNoteAction } from "@/lib/actions/quizzes";
import { useAppStore } from "@/store/use-app-store";
import { Spinner } from "@/components/ui/spinner";

export default function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const { setCurrentTopic } = useAppStore();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function loadNote() {
      try {
        const data = await getNoteById(id);
        if (!data) {
          router.push("/dashboard/notes");
          return;
        }
        setNote(data);
      } catch (err) {
        console.error("Failed to load note:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNote();
  }, [id, router]);

  const handleSave = async (title: string, content: string) => {
    try {
      const updated = await updateNoteAction(id, title, content);
      if (updated) {
        setNote(updated);
      }
    } catch (err) {
      console.error("Failed to save note:", err);
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    setActionLoading("deleting");
    try {
      await deleteNoteAction(id);
      router.push("/dashboard/notes");
    } catch (err) {
      console.error("Failed to delete note:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePracticeFlashcards = () => {
    if (!note) return;
    setActionLoading("flashcards");
    startTransition(async () => {
      try {
        await generateFlashcardsFromNoteAction(id);
        setCurrentTopic(note.title);
        router.push("/dashboard/flashcards");
      } catch (err) {
        console.error("Failed to generate flashcards:", err);
        alert("Failed to generate flashcards from note. Your database might be paused, or there was a system error.");
      } finally {
        setActionLoading(null);
      }
    });
  };

  const handleTakeQuiz = () => {
    if (!note) return;
    setActionLoading("quiz");
    startTransition(async () => {
      try {
        await generateQuizFromNoteAction(id);
        setCurrentTopic(note.title);
        router.push("/dashboard/quizzes");
      } catch (err) {
        console.error("Failed to generate quiz:", err);
        alert("Failed to generate quiz from note. Your database might be paused, or there was a system error.");
      } finally {
        setActionLoading(null);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full hover:scale-105 active:scale-95 transition-all">
            <Link href="/dashboard/notes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-sm font-semibold text-muted-foreground">Study Workspace</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePracticeFlashcards}
            disabled={actionLoading !== null || isPending}
            className="flex items-center gap-1.5 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20"
          >
            {actionLoading === "flashcards" ? (
              <Spinner size="sm" />
            ) : (
              <BrainCircuit className="h-4 w-4" />
            )}
            Practice Flashcards
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTakeQuiz}
            disabled={actionLoading !== null || isPending}
            className="flex items-center gap-1.5 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20"
          >
            {actionLoading === "quiz" ? (
              <Spinner size="sm" />
            ) : (
              <GraduationCap className="h-4 w-4" />
            )}
            Take Quiz
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={actionLoading !== null || isPending}
            className="text-destructive hover:bg-destructive/10 rounded-full h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor view with Autosave */}
      <div className="bg-card rounded-2xl border shadow-sm select-text">
        <Editor
          initialTitle={note.title}
          initialContent={note.content}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
