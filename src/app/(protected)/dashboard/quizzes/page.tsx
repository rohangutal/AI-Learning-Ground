"use client";

import { useEffect, useState, useTransition } from "react";
import { FadeIn, SlideUp } from "@/components/ui/animations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  getQuizzes, 
  generateQuizAction, 
  generateQuizFromNoteAction,
  submitQuizScoreAction, 
  deleteQuizAction 
} from "@/lib/actions/quizzes";
import { getNotes } from "@/lib/actions/notes";
import { useAppStore } from "@/store/use-app-store";
import { 
  BrainCircuit, 
  Play, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  HelpCircle, 
  ArrowRight,
  BookOpen,
  Award,
  ChevronRight,
  FileText
} from "lucide-react";

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface QuizType {
  id: string;
  title: string;
  noteId: string | null;
  questions: Question[] | string;
  score: number | null;
  totalQuestions: number;
  createdAt: Date | string;
}

interface NoteType {
  id: string;
  title: string;
  content: string;
}

export default function QuizzesPage() {
  const { currentTopic, setCurrentTopic } = useAppStore();
  
  // Data State
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [notesList, setNotesList] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [generationType, setGenerationType] = useState<"topic" | "note">("topic");
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Play State
  const [playQuiz, setPlayQuiz] = useState<QuizType | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [playAnswers, setPlayAnswers] = useState<string[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const [, startTransition] = useTransition();

  // Load quizzes and notes from actions
  const loadData = async () => {
    try {
      const [quizzesData, notesData] = await Promise.all([
        getQuizzes(),
        getNotes()
      ]);
      setQuizzes(quizzesData as QuizType[]);
      setNotesList(notesData as NoteType[]);
    } catch (err) {
      console.error("Failed to load quizzes or notes data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update inputs when global currentTopic changes
  useEffect(() => {
    if (currentTopic) {
      setTopicInput(currentTopic);
    }
  }, [currentTopic]);

  // Set default note selection when list loads
  useEffect(() => {
    if (notesList.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notesList[0].id);
    }
  }, [notesList, selectedNoteId]);

  // Generate AI Quiz Handler
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      let newQuiz;
      if (generationType === "topic") {
        if (!topicInput.trim()) return;
        newQuiz = await generateQuizAction(topicInput.trim());
        setCurrentTopic(topicInput.trim()); // sync to global store
      } else {
        if (!selectedNoteId) return;
        newQuiz = await generateQuizFromNoteAction(selectedNoteId);
        
        // Find note title to optionally sync as study topic
        const note = notesList.find(n => n.id === selectedNoteId);
        if (note) {
          setCurrentTopic(note.title);
        }
      }

      setQuizzes((prev) => [newQuiz as QuizType, ...prev]);
      setTopicInput("");
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Failed to generate quiz:", err);
    } finally {
      setGenerating(false);
    }
  };

  // Delete Quiz Handler
  const handleDeleteQuiz = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteQuizAction(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error("Failed to delete quiz:", err);
    }
  };

  // Start Playing a Quiz
  const startQuiz = (quiz: QuizType) => {
    setPlayQuiz(quiz);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setHasSubmittedAnswer(false);
    setQuizScore(0);
    setPlayAnswers([]);
    setQuizCompleted(false);
  };

  // Submit/Check Option Selection
  const handleSelectOption = (option: string) => {
    if (hasSubmittedAnswer) return;
    setSelectedAnswer(option);
    setHasSubmittedAnswer(true);

    const questions: Question[] = typeof playQuiz!.questions === "string" 
      ? JSON.parse(playQuiz!.questions) 
      : playQuiz!.questions;
    const currentQuestion = questions[currentQuestionIdx];

    const isCorrect = option === currentQuestion.answer;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
    setPlayAnswers((prev) => [...prev, option]);
  };

  // Go to next question or finish quiz
  const handleNext = () => {
    const questions: Question[] = typeof playQuiz!.questions === "string" 
      ? JSON.parse(playQuiz!.questions) 
      : playQuiz!.questions;

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasSubmittedAnswer(false);
    } else {
      // Calculate score percentage
      const finalScorePercentage = Math.round((quizScore / questions.length) * 100);
      
      // Update DB Score
      startTransition(async () => {
        await submitQuizScoreAction(playQuiz!.id, finalScorePercentage);
        setQuizzes((prev) =>
          prev.map((q) =>
            q.id === playQuiz!.id ? { ...q, score: finalScorePercentage } : q
          )
        );
      });
      setQuizCompleted(true);
    }
  };

  const getNoteTitle = (noteId: string | null) => {
    if (!noteId) return null;
    const found = notesList.find(n => n.id === noteId);
    return found ? found.title : null;
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading your quizzes...</p>
        </div>
      </div>
    );
  }

  // Quiz Gameplay View
  if (playQuiz && !quizCompleted) {
    const questions: Question[] = typeof playQuiz.questions === "string" 
      ? JSON.parse(playQuiz.questions) 
      : playQuiz.questions;
    
    const currentQuestion = questions[currentQuestionIdx];
    const progress = ((currentQuestionIdx + 1) / questions.length) * 100;

    return (
      <FadeIn>
        <div className="max-w-2xl mx-auto space-y-6 py-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="font-bold text-xl truncate max-w-[400px]">{playQuiz.title}</h2>
              <p className="text-xs text-muted-foreground">Question {currentQuestionIdx + 1} of {questions.length}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPlayQuiz(null)}>
              Exit Quiz
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question Card */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg leading-relaxed font-semibold">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOption = option === currentQuestion.answer;
                
                let optionStyle = "border hover:bg-muted/30";
                let icon = null;

                if (hasSubmittedAnswer) {
                  if (isCorrectOption) {
                    optionStyle = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 font-semibold";
                    icon = <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0 ml-auto" />;
                  } else if (isSelected) {
                    optionStyle = "border-destructive bg-destructive/10 text-destructive font-semibold";
                    icon = <XCircle className="h-4 w-4 text-destructive shrink-0 ml-auto" />;
                  } else {
                    optionStyle = "border-border opacity-50";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={hasSubmittedAnswer}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl text-sm transition-all text-left ${optionStyle}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {icon}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Immediate Feedback Explanation Block */}
          {hasSubmittedAnswer && (
            <SlideUp>
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                    Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  <p className="mb-4">{currentQuestion.explanation}</p>
                  <Button onClick={handleNext} className="w-full sm:w-auto flex items-center gap-1.5 ml-auto">
                    {currentQuestionIdx < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </SlideUp>
          )}
        </div>
      </FadeIn>
    );
  }

  // Quiz Score Summary View
  if (playQuiz && quizCompleted) {
    const questions: Question[] = typeof playQuiz.questions === "string" 
      ? JSON.parse(playQuiz.questions) 
      : playQuiz.questions;

    const percentage = Math.round((quizScore / questions.length) * 100);

    return (
      <FadeIn>
        <div className="max-w-2xl mx-auto space-y-6 py-4">
          <Card className="text-center p-8 border-2 border-primary/20 bg-primary/5 space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Award className="h-10 w-10 animate-bounce" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Quiz Completed!</CardTitle>
              <CardDescription className="text-base">
                Your performance on {playQuiz.title} has been logged.
              </CardDescription>
            </div>

            <div className="grid grid-cols-2 gap-4 border-y py-4 my-2 max-w-sm mx-auto">
              <div>
                <div className="text-3xl font-extrabold text-primary">{quizScore} / {questions.length}</div>
                <div className="text-xs text-muted-foreground">Correct Answers</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-primary">{percentage}%</div>
                <div className="text-xs text-muted-foreground">Final Score</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => setPlayQuiz(null)}>
                Back to Dashboard
              </Button>
              <Button onClick={() => startQuiz(playQuiz)}>
                Retake Quiz
              </Button>
            </div>
          </Card>

          {/* Detailed Question Review List */}
          <h3 className="text-lg font-bold tracking-tight">Question Review</h3>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const selected = playAnswers[idx];
              const isCorrect = selected === q.answer;

              return (
                <Card key={idx} className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      Question {idx + 1}: {q.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <p className={`flex items-center gap-2 ${isCorrect ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                        Your answer: <span className="font-semibold">{selected}</span>
                        {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </p>
                      {!isCorrect && (
                        <p className="text-green-600 dark:text-green-400 flex items-center gap-2">
                          Correct answer: <span className="font-semibold">{q.answer}</span>
                        </p>
                      )}
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg text-xs text-muted-foreground mt-2 border">
                      <span className="font-bold text-foreground">Explanation:</span> {q.explanation}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </FadeIn>
    );
  }

  // Dashboard List View
  return (
    <div className="space-y-8 pb-8">
      <FadeIn>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Quizzes</h1>
            <p className="text-muted-foreground">Test your understanding and retention of study concepts.</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Quiz
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleGenerateQuiz}>
                  <DialogHeader>
                    <DialogTitle>Generate Study Quiz</DialogTitle>
                    <DialogDescription>
                      Create a custom multiple choice quiz dynamically using AI.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Generation Source</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={generationType === "topic" ? "default" : "outline"}
                          className="text-xs h-9"
                          onClick={() => setGenerationType("topic")}
                        >
                          By Study Topic
                        </Button>
                        <Button
                          type="button"
                          variant={generationType === "note" ? "default" : "outline"}
                          className="text-xs h-9"
                          onClick={() => setGenerationType("note")}
                        >
                          From Study Note
                        </Button>
                      </div>
                    </div>

                    {generationType === "topic" ? (
                      <div className="space-y-2">
                        <Label htmlFor="quiz-topic">Quiz Topic</Label>
                        <Input
                          id="quiz-topic"
                          placeholder="e.g. supervised vs unsupervised learning"
                          value={topicInput}
                          onChange={(e) => setTopicInput(e.target.value)}
                          required={generationType === "topic"}
                          disabled={generating}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="quiz-note">Select Study Note</Label>
                        <select
                          id="quiz-note"
                          value={selectedNoteId}
                          onChange={(e) => setSelectedNoteId(e.target.value)}
                          required={generationType === "note"}
                          disabled={generating}
                          className="w-full h-10 px-3 py-2 text-sm bg-background border rounded-md shadow-sm outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="" disabled>-- Select a note --</option>
                          {notesList.map((note) => (
                            <option key={note.id} value={note.id}>
                              {note.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={generating}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={generating || (generationType === "note" && !selectedNoteId)}>
                      {generating ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Generating...
                        </>
                      ) : (
                        "Generate Quiz"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-3">
        <SlideUp delay={0.1} className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Active Quizzes
              </CardTitle>
              <CardDescription>Practice quizzes generated from your study materials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizzes.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No quizzes generated yet. Click &quot;Generate Quiz&quot; above to start testing your knowledge!
                </div>
              ) : (
                quizzes.map((quiz) => (
                  <div 
                    key={quiz.id} 
                    onClick={() => startQuiz(quiz)}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/10 transition-colors cursor-pointer group"
                  >
                    <div className="space-y-1 max-w-[70%]">
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors flex items-center gap-1.5 truncate">
                        {quiz.title}
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </h3>
                      <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                        <span>{quiz.totalQuestions} Questions</span>
                        {quiz.noteId && (
                          <>
                            <span>•</span>
                            <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium text-foreground flex items-center gap-1 shrink-0">
                              <FileText className="h-2.5 w-2.5" />
                              Note: {getNoteTitle(quiz.noteId) || "Sample Note"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {quiz.score !== null ? (
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium">Last Score: {quiz.score}%</p>
                        </div>
                      ) : (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground italic">Not taken yet</p>
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="gap-2 shrink-0">
                        <Play className="h-3.5 w-3.5" />
                        Start
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/15 shrink-0"
                        onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                      >
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
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                AI Quizzes can be generated from either a general **study topic** or using the exact content of your **saved notes**.
              </p>
              <p>
                Testing your understanding helps reinforce learning through retrieval practice, which is one of the most effective study techniques.
              </p>
              {currentTopic && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-semibold text-foreground">Coordinated Topic:</p>
                  <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 py-1 px-2.5 rounded-full border border-primary/20 w-fit">
                    <BookOpen className="h-3.5 w-3.5" />
                    {currentTopic}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </SlideUp>
      </div>
    </div>
  );
}
