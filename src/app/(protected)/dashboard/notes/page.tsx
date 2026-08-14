"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Plus, 
  Sparkles, 
  Search, 
  BrainCircuit, 
  GraduationCap, 
  Trash2, 
  Calendar,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getNotes, createNoteAction, deleteNoteAction } from "@/lib/actions/notes";
import { generateFlashcardsFromNoteAction } from "@/lib/actions/flashcards";
import { generateQuizFromNoteAction } from "@/lib/actions/quizzes";
import { useAppStore } from "@/store/use-app-store";
import { FadeIn, SlideUp } from "@/components/ui/animations";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotesListPage() {
  const router = useRouter();
  const { setCurrentTopic } = useAppStore();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionNoteId, setActionNoteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleCreateNote = async () => {
    setActionNoteId("creating");
    try {
      const newNote = await createNoteAction("Untitled Note", "");
      if (newNote) {
        router.push(`/dashboard/notes/${newNote.id}`);
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    } finally {
      setActionNoteId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNoteAction(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handlePracticeFlashcards = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActionNoteId(`flashcards-${id}`);
    startTransition(async () => {
      try {
        await generateFlashcardsFromNoteAction(id);
        setCurrentTopic(title);
        router.push("/dashboard/flashcards");
      } catch (err) {
        console.error("Failed to generate flashcards:", err);
        alert("Failed to generate flashcards from note. Your database might be paused, or there was a system error.");
      } finally {
        setActionNoteId(null);
      }
    });
  };

  const handleTakeQuiz = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActionNoteId(`quiz-${id}`);
    startTransition(async () => {
      try {
        await generateQuizFromNoteAction(id);
        setCurrentTopic(title);
        router.push("/dashboard/quizzes");
      } catch (err) {
        console.error("Failed to generate quiz:", err);
        alert("Failed to generate quiz from note. Your database might be paused, or there was a system error.");
      } finally {
        setActionNoteId(null);
      }
    });
  };

  const filteredNotes = notes.filter(note => {
    const query = searchTerm.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      (note.content || "").toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Study Notes</h1>
            <p className="text-muted-foreground text-sm">
              Manage your personal library and generate active recall tools directly.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="gap-2">
              <Link href="/dashboard/notes/generate">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                AI Notes Generator
              </Link>
            </Button>
            <Button 
              onClick={handleCreateNote} 
              disabled={actionNoteId === "creating"}
              className="gap-2"
            >
              {actionNoteId === "creating" ? <Spinner size="sm" /> : <Plus className="h-4 w-4" />}
              New Note
            </Button>
          </div>
        </div>

        {/* Search controls */}
        {notes.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        )}

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={searchTerm ? "No notes match your search" : "Your notebook is empty"}
            description={
              searchTerm
                ? "Try adjusting your keywords or search query."
                : "Generate custom study materials with AI or start writing notes manually."
            }
            actionLabel={!searchTerm ? "Create Blank Note" : undefined}
            onAction={!searchTerm ? handleCreateNote : undefined}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note, idx) => (
              <SlideUp key={note.id} delay={0.05 * Math.min(idx, 6)}>
                <Card 
                  onClick={() => router.push(`/dashboard/notes/${note.id}`)}
                  className="hover:border-primary/50 transition-all duration-300 cursor-pointer flex flex-col h-[220px] group relative shadow-sm"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors flex-1">
                        {note.title || "Untitled Note"}
                      </CardTitle>
                      <button
                        onClick={(e) => handleDelete(note.id, e)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <CardDescription className="text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Updated {new Date(note.updatedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4 flex flex-col justify-between overflow-hidden">
                    <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed flex-1">
                      {note.content || <span className="italic text-muted-foreground/30">Start writing content...</span>}
                    </p>

                    {/* Integrated feature operations */}
                    <div className="flex items-center justify-end gap-1.5 border-t pt-3 mt-3 select-none shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionNoteId !== null || isPending}
                        onClick={(e) => handlePracticeFlashcards(note.id, note.title, e)}
                        className="text-[10px] h-7 px-2 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 flex items-center gap-1 text-muted-foreground"
                      >
                        {actionNoteId === `flashcards-${note.id}` ? (
                          <Spinner size="sm" />
                        ) : (
                          <BrainCircuit className="h-3.5 w-3.5" />
                        )}
                        Cards
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionNoteId !== null || isPending}
                        onClick={(e) => handleTakeQuiz(note.id, note.title, e)}
                        className="text-[10px] h-7 px-2 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 flex items-center gap-1 text-muted-foreground"
                      >
                        {actionNoteId === `quiz-${note.id}` ? (
                          <Spinner size="sm" />
                        ) : (
                          <GraduationCap className="h-3.5 w-3.5" />
                        )}
                        Quiz
                      </Button>
                      <div className="h-5 w-px bg-border mx-1" />
                      <span className="text-[10px] text-primary flex items-center font-medium group-hover:translate-x-1 transition-transform">
                        Edit <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </SlideUp>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
