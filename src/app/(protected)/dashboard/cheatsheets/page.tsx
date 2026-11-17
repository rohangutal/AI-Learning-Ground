"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FadeIn, SlideUp } from "@/components/ui/animations";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  getCheatsheets, 
  generateCheatsheetAction, 
  deleteCheatsheetAction 
} from "@/lib/actions/cheatsheets";
import { 
  FileCode2, 
  Plus, 
  Trash2, 
  FileText,
  ArrowRight
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

interface CheatsheetType {
  id: string;
  title: string;
  description: string | null;
  content: {
    title: string;
    description: string;
    sections: Array<{
      category: string;
      items: Array<{
        title: string;
        syntax: string;
        description: string;
        example?: string;
      }>;
    }>;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function CheatsheetsPage() {
  const router = useRouter();
  
  // Data State
  const [cheatsheetsList, setCheatsheetsList] = useState<CheatsheetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { currentTopic } = useAppStore();

  useEffect(() => {
    if (currentTopic) {
      setTopicInput(currentTopic);
    }
  }, [currentTopic]);
  
  const [, startTransition] = useTransition();

  const loadData = async () => {
    try {
      const data = await getCheatsheets();
      setCheatsheetsList(data as unknown as CheatsheetType[]);
    } catch (err) {
      console.error("Failed to load cheatsheets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setGenerating(true);
    startTransition(async () => {
      try {
        const newCheatsheet = await generateCheatsheetAction(topicInput);
        if (newCheatsheet) {
          setIsDialogOpen(false);
          setTopicInput("");
          router.push(`/dashboard/cheatsheets/${newCheatsheet.id}` as never);
        }
      } catch (err) {
        console.error("Failed to generate cheatsheet:", err);
        alert("Failed to generate cheatsheet. Please try again.");
      } finally {
        setGenerating(false);
      }
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this cheatsheet?")) return;

    try {
      const res = await deleteCheatsheetAction(id);
      if (res.success) {
        setCheatsheetsList(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete cheatsheet:", err);
      alert("Failed to delete cheatsheet.");
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
      {/* Page Header */}
      <FadeIn>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              AI Cheatsheet Generator
            </h1>
            <p className="text-muted-foreground text-sm">
              Generate instant command cheatsheets, syntax helpers, and reference tables for any technology or topic.
            </p>
          </div>
          <div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md">
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Cheatsheet
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleGenerate}>
                  <DialogHeader>
                    <DialogTitle>Create New Cheatsheet</DialogTitle>
                    <DialogDescription>
                      Enter a framework, programming language, CLI tool, or subject to synthesize a quick reference card.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="topic">Topic / Technology</Label>
                      <Input
                        id="topic"
                        placeholder="e.g. Git Branching, Pandas DataFrames, SQL Joins, CSS Flexbox"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        required
                        disabled={generating}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={generating || !topicInput.trim()} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md">
                      {generating ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Synthesizing reference card...
                        </>
                      ) : (
                        "Generate cheatsheet"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </FadeIn>

      {/* Cheatsheets List Grid */}
      {cheatsheetsList.length === 0 ? (
        <FadeIn>
          <Card className="flex flex-col items-center justify-center p-12 border-dashed border-2">
            <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center mb-4 text-violet-600">
              <FileCode2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Cheatsheets generated yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm text-center mb-6">
              Create your first syntax or command reference cheatsheet to help you code and study faster.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-violet-600 text-white hover:bg-violet-700">
              <Plus className="mr-2 h-4 w-4" />
              Generate Cheatsheet
            </Button>
          </Card>
        </FadeIn>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cheatsheetsList.map((cheatsheet, idx) => {
            const sectionCount = cheatsheet.content?.sections?.length || 0;
            const totalItemsCount = cheatsheet.content?.sections?.reduce(
              (acc: number, section: { items?: unknown[] }) => acc + (section.items?.length || 0), 0
            ) || 0;

            return (
              <SlideUp key={cheatsheet.id} delay={idx * 0.05}>
                <Card 
                  onClick={() => router.push(`/dashboard/cheatsheets/${cheatsheet.id}` as never)}
                  className="cursor-pointer group flex flex-col justify-between hover:shadow-md hover:border-violet-300 transition-all duration-300 relative overflow-hidden h-full border"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                        <FileCode2 className="h-5 w-5" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => handleDelete(cheatsheet.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="mt-4 text-xl line-clamp-1 group-hover:text-violet-600 transition-colors">
                      {cheatsheet.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px] mt-1.5 text-sm">
                      {cheatsheet.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-4">
                    <div className="flex gap-4 text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        {sectionCount} Categories
                      </span>
                      <span>•</span>
                      <span>{totalItemsCount} Reference Items</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 border-t flex justify-end text-xs font-semibold text-violet-600 group-hover:text-indigo-600 transition-colors">
                    <span className="flex items-center gap-1">
                      View reference card
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardFooter>
                </Card>
              </SlideUp>
            );
          })}
        </div>
      )}
    </div>
  );
}
