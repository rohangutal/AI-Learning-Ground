"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, SlideUp } from "@/components/ui/animations";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
      {/* Dynamic background gradients */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-50 blur-[100px]"></div>

      <div className="mx-auto max-w-5xl px-6 text-center">
        <FadeIn delay={0.1}>
          <div className="mx-auto mb-6 flex max-w-fit items-center justify-center space-x-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Introducing StudyOS v2.0</span>
          </div>
        </FadeIn>

        <SlideUp delay={0.2}>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Your Brain, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Supercharged by AI.
            </span>
          </h1>
        </SlideUp>

        <SlideUp delay={0.3} yOffset={30}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Upload PDFs, summarize YouTube lectures, and let our AI tutor generate flashcards instantly. 
            The all-in-one minimal workspace for ambitious students.
          </p>
        </SlideUp>

        <SlideUp delay={0.4} yOffset={40}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="rounded-full px-8 h-12 text-base" asChild>
              <Link href="/signup">
                Start Learning Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base bg-background/50 backdrop-blur" asChild>
              <Link href="#features">
                See How It Works
              </Link>
            </Button>
          </div>
        </SlideUp>

        {/* Dashboard Preview Mockup */}
        <SlideUp delay={0.6} yOffset={60}>
          <div className="mt-16 sm:mt-24">
            <div className="rounded-xl border bg-background/50 p-2 backdrop-blur-md shadow-2xl ring-1 ring-border/50">
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="h-8 border-b bg-muted/50 flex items-center px-4 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="aspect-[16/9] w-full bg-muted/20 relative flex items-center justify-center p-8">
                  {/* Mockup content */}
                  <div className="w-full h-full border border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center text-muted-foreground/50">
                    <span className="font-mono text-sm">Dashboard UI Preview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SlideUp>
      </div>
    </section>
  );
}
