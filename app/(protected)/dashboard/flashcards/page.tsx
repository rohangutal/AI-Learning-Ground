"use client";

import { Flashcard } from "@/features/study/components/flashcard";
import { FadeIn, SlideUp } from "@/components/ui/animations";
import { EmptyState } from "@/components/ui/empty-state";
import { BrainCircuit } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const mockFlashcards = [
  { front: "What is an Artificial Neural Network?", back: "A computing system inspired by the biological neural networks that constitute animal brains." },
  { front: "What is Backpropagation?", back: "An algorithm used in training neural networks to calculate the gradient of the loss function with respect to the weights." },
  { front: "Define Gradient Descent.", back: "An optimization algorithm used to minimize the loss function by iteratively moving in the direction of steepest descent." },
];

export default function FlashcardsPage() {
  const [cards] = useState(mockFlashcards);

  return (
    <FadeIn>
      <div className="flex flex-col gap-8 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Flashcards</h1>
            <p className="text-sm text-muted-foreground">
              Review your auto-generated flashcards using spaced repetition.
            </p>
          </div>
          <Button>Generate New</Button>
        </div>

        {cards.length === 0 ? (
          <EmptyState
            icon={BrainCircuit}
            title="No flashcards yet"
            description="Upload a note or PDF and let the AI generate flashcards for you."
            actionLabel="Go to Notes"
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, idx) => (
              <SlideUp key={idx} delay={0.1 * idx}>
                <Flashcard front={card.front} back={card.back} />
              </SlideUp>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
