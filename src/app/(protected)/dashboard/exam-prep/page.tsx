"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FadeIn, SlideUp } from "@/components/ui/animations";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ClipboardCheck, 
  Plus, 
  Calendar, 
  BookOpen, 
  Layers, 
  Award, 
  Trash2, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { getExams, createExamAction, deleteExamAction } from "@/lib/actions/exams";
import { Spinner } from "@/components/ui/spinner";

interface Exam {
  id: string;
  userId: string;
  name: string;
  subject: string;
  semesterBranch: string;
  examDate: Date | string;
  totalMarks: number;
  syllabus: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function ExamPrepListPage() {
  const router = useRouter();
  const [examsList, setExamsList] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [examName, setExamName] = useState("");
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    try {
      const data = await getExams();
      setExamsList(data);
    } catch (err) {
      console.error("Failed to load exams:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName || !subject || !examDate) {
      alert("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const newExam = await createExamAction({
        name: examName,
        subject,
        examDateString: examDate,
      });

      setDialogOpen(false);
      // Reset form
      setExamName("");
      setSubject("");
      setExamDate("");

      if (newExam) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/dashboard/exam-prep/${newExam.id}` as any);
      } else {
        loadExams();
      }
    } catch (err) {
      console.error("Failed to create exam:", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to create exam: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this exam and all its extracted papers & questions?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteExamAction(id);
      setExamsList(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete exam:", err);
      alert("Failed to delete exam.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Exam Prep Center
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Analyze past papers, identify repeated questions, predict likely topics, and view exam patterns.
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-md shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] transition-all cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Setup New Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <form onSubmit={handleCreateExam}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    Step 1: Exam Setup
                  </DialogTitle>
                  <DialogDescription>
                    Provide key details about the upcoming exam to customize the AI analysis pipeline.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="examName">Exam Name *</Label>
                      <Input 
                        id="examName" 
                        placeholder="e.g. End Semester Exam" 
                        value={examName} 
                        onChange={(e) => setExamName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input 
                        id="subject" 
                        placeholder="e.g. Machine Learning" 
                        value={subject} 
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="examDate">Exam Date *</Label>
                    <Input 
                      id="examDate" 
                      type="date" 
                      value={examDate} 
                      onChange={(e) => setExamDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Setting up..." : "Create & Next"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </FadeIn>

      {/* Grid List */}
      <SlideUp delay={0.1}>
        {examsList.length === 0 ? (
          <Card className="border-dashed border-2 py-16 text-center max-w-xl mx-auto bg-muted/5">
            <CardContent className="space-y-4">
              <div className="rounded-full bg-primary/10 p-4 w-12 h-12 flex items-center justify-center mx-auto text-primary animate-pulse">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">No Exam Setups Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Set up your first exam parameters, upload past questions papers, and generate high-yield analysis.
                </p>
              </div>
              <Button onClick={() => setDialogOpen(true)} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Get Started
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {examsList.map((exam) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Link key={exam.id} href={`/dashboard/exam-prep/${exam.id}` as any}>
                <Card className="hover:shadow-lg hover:border-primary/30 hover:scale-[1.01] transition-all cursor-pointer h-full flex flex-col justify-between group">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-semibold tracking-wider text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full line-clamp-1">
                        {exam.semesterBranch}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={deletingId === exam.id}
                        onClick={(e) => handleDeleteExam(exam.id, e)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-xl font-bold mt-2 group-hover:text-primary transition-colors">
                      {exam.name}
                    </CardTitle>
                    <CardDescription className="font-medium text-foreground/80">
                      {exam.subject}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-6 text-sm text-muted-foreground border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-500" />
                      <span>Date: {new Date(exam.examDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-indigo-500" />
                      <span>Total Marks: {exam.totalMarks} Marks</span>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/10 border-t py-3 flex items-center justify-between text-xs text-primary font-semibold">
                    <span>Open Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </SlideUp>
    </div>
  );
}
