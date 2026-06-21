"use client";

import { FadeIn, SlideUp } from "@/components/ui/animations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Play, History, Sparkles } from "lucide-react";

export default function QuizzesPage() {
  const mockQuizzes = [
    {
      id: "1",
      title: "Machine Learning Basics",
      topic: "Supervised vs Unsupervised Learning",
      questionsCount: 10,
      lastScore: 80,
      date: "2 days ago",
    },
    {
      id: "2",
      title: "Advanced Data Structures",
      topic: "Red-Black Trees & Indexing",
      questionsCount: 5,
      lastScore: 100,
      date: "5 days ago",
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      <FadeIn>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Quizzes</h1>
            <p className="text-muted-foreground">Test your understanding and retention of your notes.</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Quiz
            </Button>
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
              {mockQuizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/10 transition-colors">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base">{quiz.title}</h3>
                    <p className="text-xs text-muted-foreground">{quiz.topic} • {quiz.questionsCount} Questions</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">Last Score: {quiz.lastScore}%</p>
                      <p className="text-xs text-muted-foreground">{quiz.date}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Play className="h-3.5 w-3.5" />
                      Start
                    </Button>
                  </div>
                </div>
              ))}
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
                AI Quizzes are dynamically generated from the notes you create or upload.
              </p>
              <p>
                Each quiz adapts to your learning pace, testing you on key formulas, concepts, and definitions using spaced repetition principles.
              </p>
              <div className="pt-2 border-t flex items-center justify-between text-xs font-medium text-foreground">
                <span className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  Detailed performance logs
                </span>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
      </div>
    </div>
  );
}
