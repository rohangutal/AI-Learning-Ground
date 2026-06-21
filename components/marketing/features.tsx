"use client";

import { BrainCircuit, FileVideo, Network, Zap } from "lucide-react";
import { FadeIn, SlideUp } from "@/components/ui/animations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "PDF to Knowledge",
    description: "Upload any textbook or lecture slide. Our AI instantly summarizes it and extracts the core concepts.",
    icon: Zap,
  },
  {
    title: "YouTube Summaries",
    description: "Paste a lecture link. Get instant timestamped notes, transcripts, and key takeaways.",
    icon: FileVideo,
  },
  {
    title: "Smart Flashcards",
    description: "Convert your notes into spaced-repetition flashcards automatically with a single click.",
    icon: BrainCircuit,
  },
  {
    title: "Knowledge Graph",
    description: "See how your courses connect. A visual representation of your entire learning journey.",
    icon: Network,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything you need to ace your exams.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for BCA, MCA, and Engineering students. StudyOS replaces your scattered workflow with one unified intelligent workspace.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <SlideUp key={feature.title} delay={0.1 * index}>
              <Card className="h-full bg-background border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </SlideUp>
          ))}
        </div>
      </div>
    </section>
  );
}
