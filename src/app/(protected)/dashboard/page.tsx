"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FadeIn, SlideUp } from "@/components/ui/animations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Plus, 
  BrainCircuit, 
  GraduationCap, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  History,
  Upload,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { getNotes, createNoteAction } from "@/lib/actions/notes";
import { getFlashcards, generateFlashcardsFromNoteAction } from "@/lib/actions/flashcards";
import { getQuizzes, generateQuizFromNoteAction } from "@/lib/actions/quizzes";
import { useAppStore } from "@/store/use-app-store";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const { setCurrentTopic } = useAppStore();
  const [userName, setUserName] = useState("Student");
  
  // Data states
  const [notes, setNotes] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [actionNoteId, setActionNoteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Student");
        }

        const [notesData, flashcardsData, quizzesData] = await Promise.all([
          getNotes(),
          getFlashcards(),
          getQuizzes()
        ]);
        setNotes(notesData);
        setFlashcards(flashcardsData);
        setQuizzes(quizzesData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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

  // Metrics calculations
  const totalNotesCount = notes.length;
  const masteredFlashcardsCount = flashcards.filter(c => c.interval >= 7).length;
  const totalFlashcardsCount = flashcards.length;
  const quizzesTakenCount = quizzes.filter(q => q.score !== null).length;

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Message */}
      <FadeIn>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome back, {userName}!
            </h1>
            <p className="text-muted-foreground text-sm">
              Your personalized study workspace is ready. Let&apos;s master some new topics today!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/uploads">
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF
              </Link>
            </Button>
            <Button onClick={handleCreateNote} disabled={actionNoteId === "creating"}>
              {actionNoteId === "creating" ? <Spinner size="sm" className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
              New Note
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Grid Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SlideUp delay={0.05}>
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Study Notes</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalNotesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Keep building your learning library.</p>
            </CardContent>
          </Card>
        </SlideUp>

        <SlideUp delay={0.1}>
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Flashcards Mastered</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <BrainCircuit className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{masteredFlashcardsCount} <span className="text-sm text-muted-foreground font-medium">/ {totalFlashcardsCount}</span></div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalFlashcardsCount > 0 
                  ? `${Math.round((masteredFlashcardsCount / totalFlashcardsCount) * 100)}% mastery rate`
                  : "Start generating flashcards to practice."}
              </p>
            </CardContent>
          </Card>
        </SlideUp>

        <SlideUp delay={0.15}>
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Quizzes Taken</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <GraduationCap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{quizzesTakenCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Test results are logged and optimized.</p>
            </CardContent>
          </Card>
        </SlideUp>

        <SlideUp delay={0.20}>
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Study Streaks</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">5 Days</div>
              <p className="text-xs text-muted-foreground mt-1">Excellent consistency! Keep it going.</p>
            </CardContent>
          </Card>
        </SlideUp>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Recent Notes & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-500" />
                  Recent Study Notes
                </CardTitle>
                <CardDescription>Start active recall from your recent materials.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/notes" className="flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {notes.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl bg-muted/10 space-y-3">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">No notes in your workspace yet.</p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/dashboard/notes/generate">Use AI Generator</Link>
                    </Button>
                    <Button size="sm" onClick={handleCreateNote}>Create Blank Note</Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {notes.slice(0, 4).map((note) => (
                    <div 
                      key={note.id}
                      onClick={() => router.push(`/dashboard/notes/${note.id}`)}
                      className="border rounded-xl p-4 hover:border-violet-500/50 hover:bg-muted/5 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[180px] group relative shadow-inner bg-card"
                    >
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors mb-1">
                          {note.title || "Untitled Note"}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                          {note.content || "Empty study note."}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-1 border-t pt-3 shrink-0 select-none">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionNoteId !== null || isPending}
                          onClick={(e) => handlePracticeFlashcards(note.id, note.title, e)}
                          className="text-[9px] h-6 px-2 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/25 flex items-center gap-1 text-muted-foreground"
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
                          className="text-[9px] h-6 px-2 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/25 flex items-center gap-1 text-muted-foreground"
                        >
                          {actionNoteId === `quiz-${note.id}` ? (
                            <Spinner size="sm" />
                          ) : (
                            <GraduationCap className="h-3.5 w-3.5" />
                          )}
                          Quiz
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Quizzes / Tests Scores */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-emerald-500" />
                  Recent Quiz Scores
                </CardTitle>
                <CardDescription>Review your latest study metrics and recall test histories.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/quizzes" className="flex items-center gap-1">
                  View Quizzes <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {quizzes.filter(q => q.score !== null).length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground italic">
                  No quizzes completed yet. Test yourself from one of your notes to track scores!
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.filter(q => q.score !== null).slice(0, 3).map((quiz) => (
                    <div 
                      key={quiz.id}
                      onClick={() => router.push("/dashboard/quizzes")}
                      className="flex items-center justify-between p-3.5 border rounded-xl hover:bg-muted/10 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{quiz.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {quiz.totalQuestions} questions • Taken on {new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 py-1 px-3 rounded-full border border-emerald-500/20">
                          {quiz.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Quick Action Center & Coordinated Topics */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border-violet-500/20 shadow-inner">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-violet-600 dark:text-violet-400">
                <Sparkles className="h-4 w-4" />
                StudyOS Hub Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <Button asChild className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md flex items-center justify-center gap-2">
                <Link href="/dashboard/notes/generate">
                  <Sparkles className="h-4 w-4" />
                  AI Notes Generator
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full flex items-center justify-center gap-2">
                <Link href="/dashboard/tutor">
                  <BookOpen className="h-4 w-4 text-violet-500" />
                  Ask AI Tutor Chat
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full flex items-center justify-center gap-2">
                <Link href="/dashboard/flashcards">
                  <BrainCircuit className="h-4 w-4 text-indigo-500" />
                  Practice Flashcards Deck
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full flex items-center justify-center gap-2">
                <Link href="/dashboard/uploads">
                  <Upload className="h-4 w-4 text-blue-500" />
                  Manage Lecture Uploads
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Coordinated Topic Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-amber-500" />
                Active Focus Concept
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                Our AI Tutor, Flashcards, and Quizzes are fully unified around your active focus topic:
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-xl w-full flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="font-bold text-amber-700 dark:text-amber-400 truncate max-w-full">
                  {useAppStore.getState().currentTopic || "No focus concept set"}
                </span>
              </div>
              <p>
                Selecting or generating study materials will automatically update your active focus concept across all tools.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
