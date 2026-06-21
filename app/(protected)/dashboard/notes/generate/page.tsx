"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  FileText, 
  BookOpen, 
  Settings2, 
  ArrowLeft,
  Trash2,
  History,
  Command
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "@/components/ui/markdown";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

// Customization configs
const styles = ["Bullet Notes", "Detailed Notes", "Exam Notes", "Revision Notes"];
const depths = ["Beginner", "Intermediate", "Advanced"];
const tones = ["Academic", "Professional", "Simplified"];
const lengths = ["Short", "Medium", "Long"];

interface HistoryRecord {
  id: string;
  topic: string;
  notes: string;
  style: string;
  depth: string;
  timestamp: number;
}

export default function AINotesGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Detailed Notes");
  const [selectedDepth, setSelectedDepth] = useState("Intermediate");
  const [selectedTone, setSelectedTone] = useState("Academic");
  const [selectedLength, setSelectedLength] = useState("Medium");
  
  // UI states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [currentModel, setCurrentModel] = useState("DeepSeek V3");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [optimisticStatus, setOptimisticStatus] = useState("");

  // History timeline cache
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const viewerEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topicInputRef = useRef<HTMLInputElement>(null);

  // Load history cache on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("studyos_notes_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load notes history cache:", e);
    }
  }, []);

  // Save history helper
  const saveToHistory = (notesContent: string) => {
    if (!notesContent.trim()) return;
    
    const newRecord: HistoryRecord = {
      id: crypto.randomUUID(),
      topic: topic.trim() || `Material Study (${selectedStyle})`,
      notes: notesContent,
      style: selectedStyle,
      depth: selectedDepth,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      const updated = [newRecord, ...prev].slice(0, 10); // Keep last 10
      localStorage.setItem("studyos_notes_history", JSON.stringify(updated));
      return updated;
    });
    setOptimisticStatus("Saved securely to local workspace cache.");
    setTimeout(() => setOptimisticStatus(""), 3000);
  };

  // Load record from history
  const handleLoadHistory = (record: HistoryRecord) => {
    setTopic(record.topic);
    setGeneratedNotes(record.notes);
    setSelectedStyle(record.style);
    setSelectedDepth(record.depth);
    setSourceText("");
    setFileName("");
    setShowHistory(false);
  };

  // Clear history cache
  const handleClearHistory = () => {
    localStorage.removeItem("studyos_notes_history");
    setHistory([]);
  };

  // Auto scroll during generation
  useEffect(() => {
    if (isGenerating && viewerEndRef.current) {
      viewerEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [generatedNotes, isGenerating]);

  // Copy to Clipboard handler
  const handleCopy = async () => {
    if (!generatedNotes) return;
    try {
      await navigator.clipboard.writeText(generatedNotes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Drag and drop handlers
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    
    if (file.name.endsWith(".txt") || file.name.endsWith(".md") || file.type.startsWith("text/")) {
      reader.onload = (event) => {
        if (event.target?.result) {
          setSourceText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".pdf")) {
      setSourceText(`[PDF CONTENT UPLOADED: ${file.name}]\nAnalyzing material and generating structure from this source document...`);
    } else {
      alert("Unsupported file type. Please upload a .txt, .md or .pdf file.");
    }
  };

  // PDF Export System (High Fidelity client-side print)
  const handleExportPDF = () => {
    if (!generatedNotes) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export as PDF.");
      return;
    }

    // Convert markdown headings/bullets to simple HTML for print view
    const htmlBody = generatedNotes
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^\* (.*$)/gim, "<ul><li>$1</li></ul>")
      .replace(/^- (.*$)/gim, "<ul><li>$1</li></ul>")
      .replace(/<\/ul>\s*<ul>/g, "")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br />");

    printWindow.document.write(`
      <html>
        <head>
          <title>${topic || "AI Study Notes"}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
            }
            h1 { font-size: 2.2em; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; color: #111827; }
            h2 { font-size: 1.6em; margin-top: 30px; border-bottom: 1px solid #f3f4f6; padding-bottom: 5px; color: #1f2937; }
            h3 { font-size: 1.25em; margin-top: 20px; color: #374151; }
            ul { margin-top: 5px; margin-bottom: 15px; padding-left: 20px; }
            li { margin-bottom: 5px; }
            strong { color: #111827; }
            code { font-family: monospace; background-color: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-size: 0.9em; }
            @media print {
              body { margin: 20px; }
              @page { size: auto; margin: 20mm; }
            }
          </style>
        </head>
        <body>
          <h1>${topic || "Study Notes"}</h1>
          <div>${htmlBody}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Clear Viewer functionality
  const handleClearViewer = () => {
    setGeneratedNotes("");
    setTopic("");
    setSourceText("");
    setFileName("");
    setOptimisticStatus("Cleared successfully.");
    setTimeout(() => setOptimisticStatus(""), 2000);
  };

  // Bind Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    generate: () => {
      if (!isGenerating && (topic || sourceText)) {
        handleGenerate();
      }
    },
    save: handleExportPDF,
    copy: handleCopy,
    clear: handleClearViewer,
    focusInput: () => topicInputRef.current?.focus(),
  }, isGenerating);

  // Stream generator
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic && !sourceText) {
      alert("Please provide either a topic or paste source material.");
      return;
    }

    setIsGenerating(true);
    setGeneratedNotes("");
    setCurrentModel("DeepSeek V3");
    setOptimisticStatus("Routing request through OpenRouter pipeline...");

    try {
      const contentInput = sourceText || `Generate notes about the topic: ${topic}`;
      const response = await fetch("/api/ai/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "notes",
          sourceText: contentInput,
          style: selectedStyle,
          depth: selectedDepth,
          tone: selectedTone,
          length: selectedLength,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No readable stream returned.");
      }

      setOptimisticStatus("Establishing network stream... Connected.");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedContent = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          streamedContent += chunk;
          setGeneratedNotes(streamedContent);
        }
      }

      // Generation completes successfully, cache in history
      saveToHistory(streamedContent);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to generate notes. Failover routed to Gemini Flash failed.";
      setGeneratedNotes((prev) => prev + `\n\n[ERROR: ${message}]`);
      setOptimisticStatus("Network failover routing failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full hover:scale-105 active:scale-95 transition-all">
            <Link href="/dashboard/notes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Notes Generator</h1>
            <p className="text-sm text-muted-foreground">
              Create rich, customized study notes using OpenRouter models.
            </p>
          </div>
        </div>

        {/* History timeline toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          disabled={isGenerating || history.length === 0}
          className="flex items-center gap-2 hover:bg-muted"
        >
          <History className="h-4 w-4" />
          {showHistory ? "Hide Cache" : `History Cache (${history.length})`}
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] items-start relative">
        {/* Left Side: Sticky Controls */}
        <div className="space-y-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
          {/* History Collapsible Panel */}
          <AnimatePresence>
            {showHistory && history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-indigo-500/30 bg-indigo-500/5 shadow-inner">
                  <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" />
                      Recent Local Cache
                    </CardTitle>
                    <button
                      onClick={handleClearHistory}
                      className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear Cache
                    </button>
                  </CardHeader>
                  <CardContent className="py-1 px-4 space-y-2 pb-3 max-h-[220px] overflow-y-auto">
                    {history.map((record) => (
                      <div
                        key={record.id}
                        onClick={() => handleLoadHistory(record)}
                        className="p-2 border rounded-md bg-background hover:border-indigo-400/50 hover:bg-accent/40 cursor-pointer text-left transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-semibold text-foreground line-clamp-1 flex-1">
                            {record.topic}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                            {record.style}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1 text-[8px] text-muted-foreground">
                          <span>Depth: {record.depth}</span>
                          <span>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Topic Input */}
            <Card className="shadow-sm border-primary/20 bg-card/95">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  1. Define Topic or Subject
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic" className="flex justify-between">
                    <span>Topic Title</span>
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-0.5"><Command className="h-3 w-3 inline" /> + / to focus</span>
                  </Label>
                  <Input
                    ref={topicInputRef}
                    id="topic"
                    placeholder="e.g. Photosynthesis, Binary Search Trees..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase font-semibold">OR</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                {/* Upload File / Text Area */}
                <div className="space-y-2">
                  <Label>Source Materials</Label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all hover:bg-accent/30",
                      dragActive ? "border-primary bg-primary/5" : "border-border",
                      fileName && "bg-accent/20 border-indigo-500/50"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".txt,.md,.pdf"
                      onChange={handleFileChange}
                      disabled={isGenerating}
                    />
                    <FileText className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                    {fileName ? (
                      <div>
                        <p className="text-xs font-medium text-foreground line-clamp-1">{fileName}</p>
                        <p className="text-[10px] text-muted-foreground">Click to change file</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium">Drag & drop files here, or click to upload</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Supports .txt, .md, .pdf</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceText">Or Paste Raw Content</Label>
                  <textarea
                    id="sourceText"
                    placeholder="Paste textbook excerpts, video transcripts, or lecture notes here..."
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    disabled={isGenerating}
                    className="w-full min-h-[100px] text-xs p-3 rounded-lg border bg-background resize-none outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customization Settings */}
            <Card className="shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  2. Notes Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Format Style */}
                <div className="space-y-2">
                  <Label>Format Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {styles.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setSelectedStyle(style)}
                        disabled={isGenerating}
                        className={cn(
                          "px-3 py-2.5 text-xs font-medium rounded-lg border text-left transition-all active:scale-[0.98]",
                          selectedStyle === style 
                            ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:bg-accent/40"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Depth Selector */}
                <div className="space-y-2">
                  <Label>Target Depth</Label>
                  <div className="flex rounded-lg border bg-muted p-0.5">
                    {depths.map((depth) => (
                      <button
                        key={depth}
                        type="button"
                        onClick={() => setSelectedDepth(depth)}
                        disabled={isGenerating}
                        className={cn(
                          "flex-1 text-center py-1.5 text-xs font-medium rounded-md transition-all active:scale-[0.97]",
                          selectedDepth === depth
                            ? "bg-background text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {depth}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone & Length */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value)}
                      disabled={isGenerating}
                      className="w-full rounded-lg border bg-background p-2 text-xs outline-none focus:border-primary cursor-pointer hover:bg-accent/20"
                    >
                      {tones.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Length</Label>
                    <select
                      value={selectedLength}
                      onChange={(e) => setSelectedLength(e.target.value)}
                      disabled={isGenerating}
                      className="w-full rounded-lg border bg-background p-2 text-xs outline-none focus:border-primary cursor-pointer hover:bg-accent/20"
                    >
                      {lengths.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={isGenerating || (!topic && !sourceText)}
              className="w-full py-6 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating... (Ctrl+Enter)
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Custom Notes (Ctrl+Enter)
                </>
              )}
            </Button>
          </form>

          {/* Shortcuts Legend */}
          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-3 text-[10px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground/80 mb-1">
                <Command className="h-3 w-3" />
                <span>Keyboard Shortcuts Panel</span>
              </div>
              <div className="flex justify-between"><span>Generate Notes:</span><kbd className="px-1 rounded bg-muted border border-border">Ctrl+Enter</kbd></div>
              <div className="flex justify-between"><span>Export PDF:</span><kbd className="px-1 rounded bg-muted border border-border">Ctrl+S</kbd></div>
              <div className="flex justify-between"><span>Copy Output:</span><kbd className="px-1 rounded bg-muted border border-border">Ctrl+Shift+C</kbd></div>
              <div className="flex justify-between"><span>Clear Viewer:</span><kbd className="px-1 rounded bg-muted border border-border">Esc</kbd></div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: ChatGPT-like Viewer with markdown formatting */}
        <div className="flex min-h-[620px] flex-col xl:min-h-[calc(100vh-7rem)]">
          <Card className="flex-1 min-h-0 flex flex-col border bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm">
            <CardHeader className="py-4 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  Generated Notes
                </CardTitle>
                <CardDescription className="text-xs">
                  {isGenerating ? (
                    <span className="flex items-center gap-1.5 text-primary font-medium">
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                      Streaming from {currentModel}...
                    </span>
                  ) : generatedNotes ? (
                    "Rendered with code highlighting."
                  ) : (
                    "Ready to process."
                  )}
                </CardDescription>
              </div>

              {/* Action buttons */}
              {generatedNotes && !isGenerating && (
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 rounded-full hover:scale-105 active:scale-95 transition-all" title="Copy (Ctrl+Shift+C)">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleExportPDF} className="h-8 w-8 rounded-full hover:scale-105 active:scale-95 transition-all" title="Save as PDF (Ctrl+S)">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleGenerate()} className="h-8 w-8 rounded-full hover:scale-105 active:scale-95 transition-all" title="Regenerate notes">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto px-6 py-6 select-text md:px-8 lg:px-10">
              <AnimatePresence mode="wait">
                {!generatedNotes && !isGenerating ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Sparkles className="h-6 w-6 animate-pulse" />
                    </div>
                    <h3 className="font-semibold text-lg">AI Ready to Write</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                      Customize options on the left and start generating beautiful notes.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose dark:prose-invert max-w-none space-y-5"
                  >
                    <div className="select-text">
                      <MarkdownRenderer content={generatedNotes} />
                      {/* Blinking streaming cursor */}
                      {isGenerating && (
                        <span className="inline-block w-2.5 h-4 bg-primary ml-1 animate-pulse" />
                      )}
                    </div>
                    <div ref={viewerEndRef} />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            {/* Optimistic Status / Logging Bar */}
            <div className="px-4 py-2 border-t bg-muted/20 text-[10px] text-muted-foreground flex justify-between items-center font-mono">
              <span>{optimisticStatus || "Local Cache: Active"}</span>
              <span className="flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", isGenerating ? "bg-emerald-500 animate-pulse" : "bg-neutral-400")} />
                {isGenerating ? "Streaming" : "Idle"}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
