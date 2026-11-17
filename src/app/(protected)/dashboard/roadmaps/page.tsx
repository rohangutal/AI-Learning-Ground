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
  getRoadmaps, 
  generateRoadmapAction, 
  deleteRoadmapAction 
} from "@/lib/actions/roadmaps";
import { 
  Map, 
  Plus, 
  Trash2, 
  Compass, 
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

interface ResourceType {
  name: string;
  description: string;
}

interface MilestoneType {
  id: string;
  title: string;
  description: string;
  duration: string;
  topics: string[];
  keyTerms: string[];
  resources: ResourceType[];
}

interface RoadmapType {
  id: string;
  title: string;
  description: string | null;
  targetLevel: string;
  duration: string;
  content: {
    title: string;
    description: string;
    milestones: MilestoneType[];
  };
  progress: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function RoadmapsPage() {
  const router = useRouter();
  
  // Data State
  const [roadmapsList, setRoadmapsList] = useState<RoadmapType[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [levelInput, setLevelInput] = useState("Beginner");
  const [durationInput, setDurationInput] = useState("2 weeks");
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
      const data = await getRoadmaps();
      setRoadmapsList(data as unknown as RoadmapType[]);
    } catch (err) {
      console.error("Failed to load roadmaps:", err);
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
        const newRoadmap = await generateRoadmapAction(topicInput, levelInput, durationInput);
        if (newRoadmap) {
          setIsDialogOpen(false);
          setTopicInput("");
          router.push(`/dashboard/roadmaps/${newRoadmap.id}` as never);
        }
      } catch (err) {
        console.error("Failed to generate roadmap:", err);
        alert("Failed to generate roadmap. Please try again.");
      } finally {
        setGenerating(false);
      }
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this roadmap?")) return;

    try {
      const res = await deleteRoadmapAction(id);
      if (res.success) {
        setRoadmapsList(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete roadmap:", err);
      alert("Failed to delete roadmap.");
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
              AI Roadmap Generator
            </h1>
            <p className="text-muted-foreground text-sm">
              Generate sequential, interactive learning paths and track your study progression milestones.
            </p>
          </div>
          <div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md">
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Roadmap
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleGenerate}>
                  <DialogHeader>
                    <DialogTitle>Create New Roadmap</DialogTitle>
                    <DialogDescription>
                      Define the topic you want to master, specify your target difficulty, and set a completion timeline.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="topic">Topic / Concept</Label>
                      <Input
                        id="topic"
                        placeholder="e.g. Next.js App Router, Docker, Quantum Computing"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        required
                        disabled={generating}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Difficulty level</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Beginner", "Intermediate", "Advanced"].map((level) => (
                          <Button
                            key={level}
                            type="button"
                            variant={levelInput === level ? "default" : "outline"}
                            className={levelInput === level ? "bg-violet-600 text-white hover:bg-violet-700" : ""}
                            onClick={() => setLevelInput(level)}
                            disabled={generating}
                          >
                            {level}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="duration">Target Duration</Label>
                      <select
                        id="duration"
                        value={durationInput}
                        onChange={(e) => setDurationInput(e.target.value)}
                        disabled={generating}
                        className="w-full h-10 px-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="1 week">1 Week</option>
                        <option value="2 weeks">2 Weeks</option>
                        <option value="1 month">1 Month</option>
                        <option value="2 months">2 Months</option>
                        <option value="3 months">3 Months</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={generating || !topicInput.trim()} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md">
                      {generating ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Analyzing and designing roadmap...
                        </>
                      ) : (
                        "Generate study path"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </FadeIn>

      {/* Roadmaps List Grid */}
      {roadmapsList.length === 0 ? (
        <FadeIn>
          <Card className="flex flex-col items-center justify-center p-12 border-dashed border-2">
            <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center mb-4 text-violet-600">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Roadmaps generated yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm text-center mb-6">
              Create your first interactive study roadmap to map out your educational goals.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-violet-600 text-white hover:bg-violet-700">
              <Plus className="mr-2 h-4 w-4" />
              Generate Roadmap
            </Button>
          </Card>
        </FadeIn>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roadmapsList.map((roadmap, idx) => {
            const completedCount = roadmap.progress?.length || 0;
            
            // Calculate total subtopics/tasks across all milestones
            const totalTasks = roadmap.content?.milestones?.reduce(
              (acc: number, milestone: MilestoneType) => acc + (milestone.topics?.length || 0), 0
            ) || 0;
            
            const progressPercent = totalTasks > 0 
              ? Math.round((completedCount / totalTasks) * 100) 
              : 0;

            return (
              <SlideUp key={roadmap.id} delay={idx * 0.05}>
                <Card 
                  onClick={() => router.push(`/dashboard/roadmaps/${roadmap.id}` as never)}
                  className="cursor-pointer group flex flex-col justify-between hover:shadow-md hover:border-violet-300 transition-all duration-300 relative overflow-hidden h-full border"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600">
                        <Map className="h-5 w-5" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => handleDelete(roadmap.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="mt-4 text-xl line-clamp-1 group-hover:text-violet-600 transition-colors">
                      {roadmap.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px] mt-1.5 text-sm">
                      {roadmap.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-4">
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                        <Layers className="h-3 w-3" />
                        {roadmap.targetLevel}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                        <Calendar className="h-3 w-3" />
                        {roadmap.duration}
                      </div>
                    </div>
                    
                    {/* Progress tracking */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                          Progress
                        </span>
                        <span>{progressPercent}% ({completedCount}/{totalTasks} tasks)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-550"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 border-t flex justify-end text-xs font-semibold text-violet-600 group-hover:text-indigo-600 transition-colors">
                    <span className="flex items-center gap-1">
                      Start learning
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
