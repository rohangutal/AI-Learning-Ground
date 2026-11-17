"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoadmapById, updateRoadmapProgressAction } from "@/lib/actions/roadmaps";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, SlideUp } from "@/components/ui/animations";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Map, 
  Calendar, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap, 
  Bookmark
} from "lucide-react";
import Link from "next/link";

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

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [roadmap, setRoadmap] = useState<RoadmapType | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  
  const [, startTransition] = useTransition();

  useEffect(() => {
    async function loadRoadmap() {
      try {
        const data = await getRoadmapById(id);
        if (!data) {
          router.push("/dashboard/roadmaps" as never);
          return;
        }
        setRoadmap(data as unknown as RoadmapType);
        setCompletedTasks((data.progress as string[]) || []);
        
        // Expand the first milestone by default
        const content = data.content as RoadmapType["content"];
        if (content?.milestones?.length > 0) {
          setExpandedMilestones({
            [content.milestones[0].id]: true
          });
        }
      } catch (err) {
        console.error("Failed to load roadmap:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRoadmap();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!roadmap) return null;

  const milestones: MilestoneType[] = roadmap.content?.milestones || [];
  
  // Calculate total tasks (subtopics) across all milestones
  const totalTasks = milestones.reduce((acc, m) => acc + (m.topics?.length || 0), 0);
  const completedCount = completedTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const toggleMilestone = (milestoneId: string) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };

  const handleTaskToggle = (milestoneId: string, topic: string) => {
    const taskKey = `${milestoneId}::${topic}`;
    let newCompleted: string[];
    
    if (completedTasks.includes(taskKey)) {
      newCompleted = completedTasks.filter(t => t !== taskKey);
    } else {
      newCompleted = [...completedTasks, taskKey];
    }
    
    setCompletedTasks(newCompleted);
    
    startTransition(async () => {
      try {
        await updateRoadmapProgressAction(id, newCompleted);
      } catch (err) {
        console.error("Failed to save progress update:", err);
        // Fallback/revert state if DB write fails
        alert("Failed to update progress on database. Please try again.");
      }
    });
  };

  // Determine completion state of a milestone
  const getMilestoneStatus = (m: MilestoneType) => {
    const milestoneTasks = m.topics.map(t => `${m.id}::${t}`);
    const completedMilestoneTasks = milestoneTasks.filter(t => completedTasks.includes(t));
    
    if (completedMilestoneTasks.length === 0) return "unstarted";
    if (completedMilestoneTasks.length === milestoneTasks.length) return "completed";
    return "in-progress";
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <FadeIn>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" asChild className="mb-2 pl-0 hover:bg-transparent">
              <Link href={"/dashboard/roadmaps" as never}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Roadmaps
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600">
                <Map className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                {roadmap.title}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-2xl">
              {roadmap.description}
            </p>
          </div>
          
          {/* Progress Card */}
          <Card className="w-full md:w-80 shadow-sm border bg-slate-50/50 dark:bg-slate-900/10">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-muted-foreground">Study Progress</span>
                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden mb-4">
                <div 
                  className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {roadmap.targetLevel}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {roadmap.duration}
                </span>
                <span>{completedCount} / {totalTasks} topics</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Interactive Timeline Graph */}
      <div className="relative max-w-4xl mx-auto pl-8 md:pl-12">
        {/* SVG Vertical Connector Line */}
        <div className="absolute left-[19px] md:left-[23px] top-4 bottom-4 w-1 bg-gradient-to-b from-violet-400 via-indigo-400 to-slate-200 dark:to-slate-800 rounded-full" />

        <div className="space-y-10">
          {milestones.map((milestone, idx) => {
            const isExpanded = !!expandedMilestones[milestone.id];
            const status = getMilestoneStatus(milestone);
            
            // Nodes mapping
            let nodeIcon = <Circle className="h-5 w-5 bg-white text-slate-300 rounded-full" />;
            let borderClass = "border-slate-200";
            let bgClass = "bg-white dark:bg-slate-950";
            
            if (status === "completed") {
              nodeIcon = <CheckCircle2 className="h-6 w-6 text-emerald-500 bg-white rounded-full dark:bg-slate-950 shadow-sm" />;
              borderClass = "border-emerald-300 dark:border-emerald-950";
              bgClass = "bg-emerald-50/20 dark:bg-emerald-950/5";
            } else if (status === "in-progress") {
              nodeIcon = <Circle className="h-6 w-6 text-violet-500 fill-violet-200 dark:fill-violet-950/50 bg-white rounded-full shadow-sm" />;
              borderClass = "border-violet-300 dark:border-violet-950";
              bgClass = "bg-violet-50/20 dark:bg-violet-950/5";
            } else {
              nodeIcon = <Circle className="h-6 w-6 text-slate-300 bg-white rounded-full dark:bg-slate-950" />;
            }

            return (
              <SlideUp key={milestone.id} delay={idx * 0.08}>
                <div className="relative group">
                  {/* Visual Node Pin */}
                  <div className="absolute -left-[30px] md:-left-[38px] top-5 z-10 flex items-center justify-center transform -translate-x-1/2">
                    {nodeIcon}
                  </div>

                  {/* Milestone Card */}
                  <Card className={`border shadow-sm transition-all duration-300 overflow-hidden ${borderClass} ${bgClass}`}>
                    {/* Header trigger (collapsible) */}
                    <div 
                      onClick={() => toggleMilestone(milestone.id)}
                      className="cursor-pointer p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors"
                    >
                      <div className="space-y-1.5 pr-4">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-xs font-bold text-violet-600 bg-violet-100 dark:bg-violet-950/50 px-2 py-0.5 rounded">
                            Phase {idx + 1}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {milestone.duration}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold group-hover:text-violet-600 transition-colors">
                          {milestone.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {milestone.description}
                        </p>
                      </div>
                      
                      <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-900">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expandable detail section */}
                    {isExpanded && (
                      <div className="border-t px-5 pb-6 pt-5 bg-white dark:bg-slate-950/20 space-y-6">
                        {/* Summary description */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Milestone Description</h4>
                          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {milestone.description}
                          </p>
                        </div>

                        {/* Topics Checklist */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Topic Checklist (Click to complete)</h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {milestone.topics.map((topic, topicIdx) => {
                              const taskKey = `${milestone.id}::${topic}`;
                              const isChecked = completedTasks.includes(taskKey);
                              
                              return (
                                <button
                                  key={topicIdx}
                                  onClick={() => handleTaskToggle(milestone.id, topic)}
                                  className={`flex items-start text-left gap-3 p-3 rounded-lg border text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-900/30 ${
                                    isChecked 
                                      ? "border-emerald-200 bg-emerald-50/10 dark:border-emerald-950 text-slate-700 dark:text-slate-300"
                                      : "border-slate-150 bg-slate-50/10 text-slate-700 dark:text-slate-350"
                                  }`}
                                >
                                  <div className="mt-0.5 flex-shrink-0">
                                    {isChecked ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/20" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-slate-300" />
                                    )}
                                  </div>
                                  <span className={isChecked ? "line-through text-slate-400 dark:text-slate-500" : "font-medium"}>
                                    {topic}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Split grid: Key Terms & Study Strategy */}
                        <div className="grid gap-6 md:grid-cols-2">
                          {/* Key Terms */}
                          <div className="p-4 rounded-xl border bg-slate-50/40 dark:bg-slate-900/5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                              <Bookmark className="h-3.5 w-3.5 text-indigo-500" />
                              Key Concepts to Master
                            </h4>
                            <ul className="space-y-1.5">
                              {milestone.keyTerms.map((term, termIdx) => (
                                <li key={termIdx} className="text-sm flex items-start gap-2">
                                  <span className="text-indigo-400 font-bold mt-0.5">•</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-350">{term}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Study Strategy / Resources */}
                          <div className="p-4 rounded-xl border bg-slate-50/40 dark:bg-slate-900/5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                              <GraduationCap className="h-3.5 w-3.5 text-violet-500" />
                              Study Strategy & Resources
                            </h4>
                            <div className="space-y-3">
                              {milestone.resources.map((res, resIdx) => (
                                <div key={resIdx} className="text-xs space-y-1">
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{res.name}</p>
                                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{res.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              </SlideUp>
            );
          })}
        </div>
      </div>
    </div>
  );
}
