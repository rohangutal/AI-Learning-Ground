"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Flame, 
  Star, 
  TrendingUp, 
  Target, 
  BarChart3, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Award,
  Layers,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import { 
  getExamById, 
  getExamPapers, 
  getExamQuestions, 
  getExamAnalysis, 
  uploadPaperAction, 
  runUnifiedAnalysisAction,
  deletePaperAction 
} from "@/lib/actions/exams";

interface UploadingFile {
  id: string;
  name: string;
  size: string;
  status: "reading" | "uploading" | "processing" | "success" | "error";
  progress: number;
  errorMsg?: string;
}

export default function ExamPrepWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  // DB data states
  const [exam, setExam] = useState<any>(null);
  const [papers, setPapers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<"upload" | "important" | "analytics" | "questions">("upload");
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);
  const [expandedRepeatedGroup, setExpandedRepeatedGroup] = useState<number | null>(null);
  const [expandedProbableQuestion, setExpandedProbableQuestion] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");

  // Search & Filter state for Questions Bank
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  useEffect(() => {
    async function loadAllData() {
      try {
        const examData = await getExamById(examId);
        if (!examData) {
          router.push("/dashboard/exam-prep" as any);
          return;
        }
        setExam(examData);

        const [papersData, questionsData, analysisData] = await Promise.all([
          getExamPapers(examId),
          getExamQuestions(examId),
          getExamAnalysis(examId)
        ]);

        setPapers(papersData);
        setQuestions(questionsData);
        setAnalysis(analysisData);
      } catch (err) {
        console.error("Failed to load workspace data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, [examId, router]);

  // Handle Drag & Drop
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesUpload(Array.from(e.target.files));
    }
  };

  const handleFilesUpload = async (files: File[]) => {
    const filesToUpload = files.filter(f => {
      const isPdf = f.type === "application/pdf" || f.name.endsWith(".pdf");
      const isDocx = f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || f.name.endsWith(".docx");
      const isImage = f.type.startsWith("image/");
      const isValid = isPdf || isDocx || isImage;
      if (!isValid) {
        alert(`Unsupported file format: ${f.name}. Only PDF, DOCX, JPG, and PNG are allowed.`);
      }
      return isValid;
    });

    if (filesToUpload.length === 0) return;

    // Add files to local progress queue
    const newQueueItems = filesToUpload.map(f => ({
      id: Math.random().toString(),
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
      status: "reading" as const,
      progress: 10,
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);

    // Process each file sequentially/concurrently
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const queueItem = newQueueItems[i];

      updateQueueItemStatus(queueItem.id, "uploading", 30);

      // Read file to Base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string;
          const base64Data = result.split(",")[1] || result;

          updateQueueItemStatus(queueItem.id, "processing", 60);

          // Call upload server action
          await uploadPaperAction(examId, file.name, base64Data, file.type);

          updateQueueItemStatus(queueItem.id, "success", 100);
          
          // Re-fetch papers and questions
          const [updatedPapers, updatedQuestions] = await Promise.all([
            getExamPapers(examId),
            getExamQuestions(examId)
          ]);
          setPapers(updatedPapers);
          setQuestions(updatedQuestions);
        } catch (err: any) {
          console.error(err);
          updateQueueItemStatus(queueItem.id, "error", 100, err.message || "AI extraction failed.");
        }
      };

      reader.onerror = () => {
        updateQueueItemStatus(queueItem.id, "error", 100, "Failed to read file.");
      };

      reader.readAsDataURL(file);
    }
  };

  const updateQueueItemStatus = (id: string, status: any, progress: number, errorMsg?: string) => {
    setUploadQueue(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status, progress, errorMsg } : item
      )
    );
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm("Are you sure you want to delete this paper? All extracted questions from this paper will be deleted too.")) return;
    try {
      await deletePaperAction(paperId, examId);
      setPapers(prev => prev.filter(p => p.id !== paperId));
      
      // Reload questions
      const updatedQuestions = await getExamQuestions(examId);
      setQuestions(updatedQuestions);
      
      // Clear analysis since papers changed
      setAnalysis(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete paper.");
    }
  };

  const handleRunAnalysis = async () => {
    if (papers.length === 0) {
      alert("Please upload at least one paper before running analysis.");
      return;
    }

    setAnalyzing(true);
    setAnalysisStep("Reading extracted questions database...");
    
    try {
      setTimeout(() => setAnalysisStep("Matching duplicate questions & semantic clusters..."), 1500);
      setTimeout(() => setAnalysisStep("Identifying core unit weightages & topic trends..."), 3000);
      setTimeout(() => setAnalysisStep("Generating probable questions and structure outlines..."), 4500);
      
      await runUnifiedAnalysisAction(examId);
      
      setTimeout(async () => {
        const updatedAnalysis = await getExamAnalysis(examId);
        const updatedQuestions = await getExamQuestions(examId);
        setAnalysis(updatedAnalysis);
        setQuestions(updatedQuestions);
        setAnalyzing(false);
        setActiveTab("important");
      }, 6000);
    } catch (err: any) {
      console.error(err);
      alert(`Analysis failed: ${err.message || err}`);
      setAnalyzing(false);
    }
  };

  // Filter questions logic
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (q.topics && q.topics.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesDifficulty = filterDifficulty === "all" || q.difficulty === filterDifficulty;
    const matchesType = filterType === "all" || q.questionType === filterType;
    const matchesYear = filterYear === "all" || String(q.year) === filterYear;
    return matchesSearch && matchesDifficulty && matchesType && matchesYear;
  });

  // Extract unique years for filtering
  const uniqueYears = Array.from(new Set(questions.map(q => q.year).filter(Boolean))).sort((a,b) => b - a);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full hover:scale-105 active:scale-95 transition-all">
            <Link href={"/dashboard/exam-prep" as any}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{exam.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-mono font-medium text-muted-foreground">
                {exam.semesterBranch}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{exam.subject} • Total Marks: {exam.totalMarks}</p>
          </div>
        </div>

        {papers.length > 0 && (
          <Button 
            onClick={handleRunAnalysis} 
            disabled={analyzing}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md flex items-center gap-2 cursor-pointer"
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {analysis ? "Regenerate Analysis" : "Run Unified AI Analysis"}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b bg-muted/40 p-1 rounded-xl max-w-2xl">
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "upload"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Papers & Uploads ({papers.length})
        </button>
        <button
          onClick={() => setActiveTab("important")}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "important"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ⭐ Important Questions
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "analytics"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          📈 Pattern Analytics
        </button>
        <button
          onClick={() => setActiveTab("questions")}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "questions"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Question Bank ({questions.length})
        </button>
      </div>

      {/* Analyzing screen overlay */}
      <AnimatePresence>
        {analyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6"
          >
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-lg animate-pulse">
              <Sparkles className="h-8 w-8 animate-spin" />
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold">AI Unified Analysis Running</h2>
              <p className="text-sm text-muted-foreground animate-bounce font-mono">{analysisStep}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Contents */}
      <div className="min-h-[400px]">
        {/* TAB 1: UPLOAD & PAPERS */}
        {activeTab === "upload" && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              {/* Drag & Drop Area */}
              <Card 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-dashed border-2 hover:border-primary/50 transition-all cursor-pointer bg-muted/10 ${
                  dragActive ? "border-primary bg-primary/5" : ""
                }`}
              >
                <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="rounded-full bg-primary/10 p-4 text-primary">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Click to upload or drag & drop exam papers</p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, JPEG, or PNG formats up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    id="paper-file"
                    multiple
                    className="hidden"
                    accept=".pdf,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  <Button size="sm" asChild className="cursor-pointer">
                    <label htmlFor="paper-file">Select Files</label>
                  </Button>
                </CardContent>
              </Card>

              {/* Uploading Queue Progress */}
              {uploadQueue.length > 0 && (
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-semibold">Processing Documents Queue</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {uploadQueue.map(item => (
                      <div key={item.id} className="p-3 border rounded-xl space-y-2 bg-muted/5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold line-clamp-1 flex-1">{item.name}</span>
                          <span className="text-muted-foreground ml-2">{item.size}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                item.status === "error" ? "bg-destructive" : "bg-primary"
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold w-8 text-right">
                            {item.progress}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`font-semibold ${
                            item.status === "success" ? "text-emerald-600" :
                            item.status === "error" ? "text-destructive" : "text-muted-foreground"
                          }`}>
                            {item.status === "reading" && "Reading file..."}
                            {item.status === "uploading" && "Uploading to server..."}
                            {item.status === "processing" && "AI extracting questions (can take 10-15s)..."}
                            {item.status === "success" && "Analyzed & Extracted Successfully!"}
                            {item.status === "error" && `Failed: ${item.errorMsg}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Uploaded Papers List */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Uploaded Papers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {papers.length === 0 ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      No past papers uploaded yet. Upload document papers above to begin.
                    </div>
                  ) : (
                    papers.map((paper) => (
                      <div key={paper.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/10 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-sm line-clamp-1">{paper.filename}</h3>
                            <p className="text-xs text-muted-foreground">
                              {paper.year ? `Year: ${paper.year} • ` : ""}Status: {paper.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            paper.status === "analyzed" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" : "text-amber-600 bg-amber-50 dark:bg-amber-950/30"
                          }`}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {paper.status === "analyzed" ? "AI Analyzed" : "Extracting"}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeletePaper(paper.id)}
                            className="text-muted-foreground hover:text-destructive rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Syllabus Summary */}
              {exam.syllabus && (
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Syllabus Blueprint
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line border-t pt-4">
                    {exam.syllabus}
                  </CardContent>
                </Card>
              )}

              {/* Setup Guideline */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                  <div className="flex gap-2">
                    <div className="h-5 w-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                    <p><strong>Upload Papers:</strong> Upload past semester papers (PDFs, DOCX, or direct images of printed paper).</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                    <p><strong>AI Processing:</strong> AI extracts every question, categorizes it, and maps it to syllabus topics dynamically.</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                    <p><strong>Run Unified Analysis:</strong> AI groups semantic duplicates and predicts patterns and probable questions.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: IMPORTANT QUESTIONS */}
        {activeTab === "important" && (
          <div>
            {!analysis ? (
              <Card className="border-dashed border-2 py-16 text-center max-w-xl mx-auto bg-muted/5">
                <CardContent className="space-y-4">
                  <div className="rounded-full bg-primary/10 p-4 w-12 h-12 flex items-center justify-center mx-auto text-primary">
                    <Star className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">Analysis Required</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Upload past exam papers, then click &quot;Run Unified AI Analysis&quot; to unlock predicted questions and topics!
                    </p>
                  </div>
                  {papers.length > 0 && (
                    <Button onClick={handleRunAnalysis} className="cursor-pointer">
                      Run Analysis Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Side: Predicted & Repeated Questions */}
                <div className="space-y-6">
                  {/* Probable Questions */}
                  <Card>
                    <CardHeader className="py-4 border-b flex flex-row items-center gap-2 space-y-0">
                      <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <Target className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">🎯 Predicted Probable Questions</CardTitle>
                        <CardDescription className="text-xs">Based on gap analysis and repetition trends.</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="divide-y p-0">
                      {analysis.mostProbableQuestions.map((q: any, idx: number) => (
                        <div key={idx} className="p-4 hover:bg-muted/5">
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-semibold text-sm leading-relaxed">{q.questionText}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 font-mono font-bold whitespace-nowrap">
                              {q.probabilityScore}% Probable
                            </span>
                          </div>
                          
                          <button
                            onClick={() => setExpandedProbableQuestion(expandedProbableQuestion === idx ? null : idx)}
                            className="mt-2 text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
                          >
                            {expandedProbableQuestion === idx ? "Hide answer outline & logic" : "Show suggested outline & logic"}
                            {expandedProbableQuestion === idx ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>

                          <AnimatePresence>
                            {expandedProbableQuestion === idx && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-3 text-xs text-muted-foreground space-y-3 bg-muted/20 p-3 rounded-lg border"
                              >
                                <div>
                                  <span className="font-bold text-foreground">AI Logic:</span>
                                  <p className="mt-0.5 leading-relaxed">{q.explanation}</p>
                                </div>
                                <div className="border-t pt-2">
                                  <span className="font-bold text-foreground">Suggested Answer Outline:</span>
                                  <div className="mt-1 leading-relaxed whitespace-pre-line">
                                    {q.suggestedAnswerOutline}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Most Repeated Questions */}
                  <Card>
                    <CardHeader className="py-4 border-b flex flex-row items-center gap-2 space-y-0">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Flame className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">🔥 Most Repeated Questions</CardTitle>
                        <CardDescription className="text-xs">Questions asked multiple times in semantically similar formats.</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="divide-y p-0">
                      {analysis.mostRepeatedQuestions.map((group: any, idx: number) => (
                        <div key={idx} className="p-4 hover:bg-muted/5">
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-semibold text-sm leading-relaxed">{group.questionText}</h3>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 font-mono font-bold whitespace-nowrap">
                              Asked {group.frequency}x
                            </span>
                          </div>
                          
                          <button
                            onClick={() => setExpandedRepeatedGroup(expandedRepeatedGroup === idx ? null : idx)}
                            className="mt-2 text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
                          >
                            {expandedRepeatedGroup === idx ? "Hide match list & reasoning" : "Show matched papers & reasoning"}
                            {expandedRepeatedGroup === idx ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>

                          <AnimatePresence>
                            {expandedRepeatedGroup === idx && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-3 text-xs text-muted-foreground space-y-3 bg-muted/20 p-3 rounded-lg border"
                              >
                                <div>
                                  <span className="font-bold text-foreground">Pattern Reasoning:</span>
                                  <p className="mt-0.5 leading-relaxed">{group.whyImportant}</p>
                                </div>
                                <div className="border-t pt-2">
                                  <span className="font-bold text-foreground">Matched Years:</span>
                                  <p className="mt-0.5 font-semibold text-foreground/80 font-mono">
                                    {group.years.join(", ")}
                                  </p>
                                </div>
                                <div className="border-t pt-2">
                                  <span className="font-bold text-foreground">Question Variations from Papers:</span>
                                  <ul className="list-disc list-inside mt-1.5 space-y-1 pl-1">
                                    {group.originalQuestions.map((variation: string, vidx: number) => (
                                      <li key={vidx} className="italic">&ldquo;{variation}&rdquo;</li>
                                    ))}
                                  </ul>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Side: Topics & Chapters Weight */}
                <div className="space-y-6">
                  {/* Important Topics */}
                  <Card>
                    <CardHeader className="py-4 border-b flex flex-row items-center gap-2 space-y-0">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <Star className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">⭐ Most Important Topics</CardTitle>
                        <CardDescription className="text-xs">Topics highly emphasized by exam setters.</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {analysis.importantTopics.map((topic: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-xl bg-card hover:border-primary/20 transition-all space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm">{topic.topic}</span>
                            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full">
                              Score: {topic.importanceScore}/100
                            </span>
                          </div>
                          
                          {/* Progress bar representing importance */}
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full" 
                              style={{ width: `${topic.importanceScore}%` }}
                            />
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t mt-1">
                            {topic.reason}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Frequently Asked Topics List */}
                  <Card>
                    <CardHeader className="py-4 border-b flex flex-row items-center gap-2 space-y-0">
                      <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                        <Layers className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">📈 Frequently Asked Topics</CardTitle>
                        <CardDescription className="text-xs">Ranked by volume of extracted questions.</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-wrap gap-2">
                      {analysis.frequentlyAskedTopics.map((item: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-1.5 text-xs bg-muted/60 border hover:bg-muted transition-colors px-3 py-1.5 rounded-lg font-medium text-foreground/80"
                        >
                          <span>{item.topic || item}</span>
                          {item.frequency !== undefined && (
                            <span className="font-mono bg-background text-[10px] text-primary px-1.5 py-0.5 rounded-md border">
                              {item.frequency}q
                            </span>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PATTERN ANALYTICS */}
        {activeTab === "analytics" && (
          <div>
            {!analysis ? (
              <Card className="border-dashed border-2 py-16 text-center max-w-xl mx-auto bg-muted/5">
                <CardContent className="space-y-4">
                  <div className="rounded-full bg-primary/10 p-4 w-12 h-12 flex items-center justify-center mx-auto text-primary">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">Analytics Pending</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Run the unified AI analysis on your past papers to generate visual charts and metrics distributions!
                    </p>
                  </div>
                  {papers.length > 0 && (
                    <Button onClick={handleRunAnalysis} className="cursor-pointer">
                      Run Analysis Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Unit Weightage Distribution */}
                <Card>
                  <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Layers className="h-4.5 w-4.5 text-indigo-500" />
                      Unit-Wise Weightage (%)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {analysis.unitWeightage.map((unit: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{unit.unit}</span>
                          <span className="font-mono">{unit.weight}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                            style={{ width: `${unit.weight}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 2. Difficulty Distribution */}
                <Card>
                  <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Award className="h-4.5 w-4.5 text-amber-500" />
                      Cognitive Difficulty Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col justify-center h-full space-y-6">
                    {/* Rendered as segmented custom progress bar */}
                    <div className="space-y-4">
                      <div className="h-6 w-full rounded-full overflow-hidden flex bg-muted">
                        {analysis.difficultyDistribution.map((item: any, idx: number) => {
                          const counts = analysis.difficultyDistribution.map((d: any) => d.count);
                          const total = counts.reduce((a: number, b: number) => a + b, 0);
                          const percentage = total > 0 ? (item.count / total) * 100 : 0;
                          
                          let bg = "bg-emerald-500";
                          if (item.difficulty.toLowerCase() === "medium") bg = "bg-amber-500";
                          if (item.difficulty.toLowerCase() === "hard") bg = "bg-rose-500";

                          return (
                            <div 
                              key={idx} 
                              className={`${bg} h-full first:rounded-l-full last:rounded-r-full transition-all`} 
                              style={{ width: `${percentage}%` }}
                              title={`${item.difficulty}: ${item.count} questions`}
                            />
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        {analysis.difficultyDistribution.map((item: any, idx: number) => {
                          let dotColor = "bg-emerald-500";
                          if (item.difficulty.toLowerCase() === "medium") dotColor = "bg-amber-500";
                          if (item.difficulty.toLowerCase() === "hard") dotColor = "bg-rose-500";

                          return (
                            <div key={idx} className="flex flex-col items-center p-2 border rounded-xl bg-muted/20">
                              <span className="flex items-center gap-1.5 font-bold text-foreground uppercase text-[10px]">
                                <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                                {item.difficulty}
                              </span>
                              <span className="text-base font-bold font-mono mt-1">{item.count} q</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Question Types Distribution */}
                <Card>
                  <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <HelpCircle className="h-4.5 w-4.5 text-blue-500" />
                      Question Types Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {analysis.questionTypes.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{item.type}</span>
                          <span className="font-mono text-muted-foreground">{item.count} Questions</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ 
                              width: `${(item.count / Math.max(...analysis.questionTypes.map((qt: any) => qt.count), 1)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 4. Marks Distribution */}
                <Card>
                  <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Award className="h-4.5 w-4.5 text-violet-500" />
                      Marks Distribution (Brackets)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {analysis.marksDistribution.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{item.range}</span>
                          <span className="font-mono">{item.count} Questions</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-violet-500 rounded-full"
                            style={{ 
                              width: `${(item.count / Math.max(...analysis.marksDistribution.map((md: any) => md.count), 1)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 5. Year-Wise Trends */}
                <Card className="md:col-span-2">
                  <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
                      Year-Wise Exam Trends Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-muted/40 border-b text-muted-foreground text-xs font-bold uppercase">
                          <th className="p-4">Academic Year</th>
                          <th className="p-4">Total Questions Extracted</th>
                          <th className="p-4">Avg Marks Per Question</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {analysis.yearWiseTrends.map((trend: any, idx: number) => (
                          <tr key={idx} className="hover:bg-muted/10">
                            <td className="p-4 font-bold font-mono text-foreground">{trend.year}</td>
                            <td className="p-4 font-mono">{trend.questionCount} Questions</td>
                            <td className="p-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              {Number(trend.averageMarksPerQuestion).toFixed(1)} Marks
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: QUESTION BANK */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <Card>
              <CardContent className="p-4 grid gap-4 sm:grid-cols-2 md:grid-cols-5 items-end">
                {/* Search */}
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="search">Search Keywords</Label>
                  <input
                    id="search"
                    placeholder="Search question text or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-sm h-10 px-3 rounded-lg border bg-background outline-none focus:border-primary"
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-1">
                  <Label htmlFor="difficulty-filter">Difficulty</Label>
                  <select
                    id="difficulty-filter"
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border bg-background outline-none focus:border-primary text-sm"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Question Type */}
                <div className="space-y-1">
                  <Label htmlFor="type-filter">Format Type</Label>
                  <select
                    id="type-filter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border bg-background outline-none focus:border-primary text-sm"
                  >
                    <option value="all">All Formats</option>
                    <option value="MCQ">MCQ</option>
                    <option value="Short Answer">Short Answer</option>
                    <option value="Long Answer">Long Answer</option>
                    <option value="Numerical">Numerical</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>

                {/* Year */}
                <div className="space-y-1">
                  <Label htmlFor="year-filter">Paper Year</Label>
                  <select
                    id="year-filter"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border bg-background outline-none focus:border-primary text-sm"
                  >
                    <option value="all">All Years</option>
                    {uniqueYears.map((year: any) => (
                      <option key={year} value={String(year)}>{year}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Questions list */}
            {filteredQuestions.length === 0 ? (
              <Card className="border-dashed border-2 py-12 text-center text-sm text-muted-foreground">
                No matching questions found in the bank. Upload papers or broaden search filters.
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => (
                  <Card key={q.id} className="hover:border-primary/20 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-sm font-semibold leading-relaxed flex-1">{q.questionText}</p>
                        
                        <div className="flex gap-1.5 items-center flex-shrink-0">
                          {q.isRepeated && (
                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200">
                              <Flame className="h-3 w-3 mr-1 inline" /> Repeated
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                            {q.marks ? `${q.marks} Marks` : "N/A Marks"}
                          </span>
                        </div>
                      </div>

                      {/* Question tags */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-[11px] text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                            q.difficulty === "easy" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" :
                            q.difficulty === "medium" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20" :
                            "bg-rose-50 text-rose-600 dark:bg-rose-950/20"
                          }`}>
                            {q.difficulty}
                          </span>
                          
                          <span className="px-2 py-0.5 rounded bg-muted text-foreground/80 font-medium">
                            {q.questionType}
                          </span>

                          {q.year && (
                            <span className="px-2 py-0.5 rounded bg-muted text-foreground/80 font-mono">
                              Year: {q.year}
                            </span>
                          )}
                        </div>

                        {q.topics && q.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {q.topics.map((t: string, idx: number) => (
                              <span key={idx} className="bg-primary/5 text-primary border px-2 py-0.5 rounded text-[10px] font-medium">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Repeated Question Explanation */}
                      {q.isRepeated && q.explanation && (
                        <div className="bg-amber-500/5 text-amber-700 dark:text-amber-400 p-2.5 rounded-lg border border-amber-500/10 text-xs flex gap-2 items-start mt-2">
                          <Flame className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                          <p className="leading-relaxed"><strong>AI Repetition logic:</strong> {q.explanation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
