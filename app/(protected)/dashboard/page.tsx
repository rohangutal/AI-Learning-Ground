"use client";

import { FadeIn, SlideUp } from "@/components/ui/animations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, BrainCircuit, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8 pb-8">
      <FadeIn>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">Here is an overview of your study progress.</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Upload PDF
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SlideUp delay={0.1}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 created this week</p>
            </CardContent>
          </Card>
        </SlideUp>
        <SlideUp delay={0.2}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flashcards Mastered</CardTitle>
              <BrainCircuit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">145</div>
              <p className="text-xs text-muted-foreground">85% retention rate</p>
            </CardContent>
          </Card>
        </SlideUp>
        <SlideUp delay={0.3}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4 Days</div>
              <p className="text-xs text-muted-foreground">Keep it up!</p>
            </CardContent>
          </Card>
        </SlideUp>
      </div>

      <FadeIn delay={0.4}>
        <h2 className="text-xl font-semibold tracking-tight mt-8 mb-4">Recent Notes</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* We will map over actual notes here later */}
          <Link href={"/dashboard/notes/1" as any}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Machine Learning Basics</CardTitle>
                <CardDescription>Created 2 days ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Introduction to supervised and unsupervised learning models, focusing on linear regression...
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href={"/dashboard/notes/2" as any}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Advanced Data Structures</CardTitle>
                <CardDescription>Created 5 days ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Deep dive into Red-Black trees, B-Trees, and their real-world applications in database indexing.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
