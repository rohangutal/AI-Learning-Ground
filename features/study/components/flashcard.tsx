"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  front: string;
  back: string;
  className?: string;
  flipped?: boolean;
  onFlip?: (flipped: boolean) => void;
}

export function Flashcard({ front, back, className, flipped, onFlip }: FlashcardProps) {
  const [localFlipped, setLocalFlipped] = useState(false);

  const isFlipped = flipped !== undefined ? flipped : localFlipped;

  const handleFlip = () => {
    const nextFlipped = !isFlipped;
    if (onFlip) {
      onFlip(nextFlipped);
    } else {
      setLocalFlipped(nextFlipped);
    }
  };

  return (
    <div 
      className={cn("w-full h-64 perspective-1000 cursor-pointer", className)}
      onClick={handleFlip}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden w-full h-full">
          <div className="w-full h-full border rounded-xl bg-card flex items-center justify-center p-6 text-center shadow-sm">
            <h3 className="text-xl font-medium">{front}</h3>
          </div>
        </div>
        
        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden w-full h-full [transform:rotateY(180deg)]"
        >
          <div className="w-full h-full border-2 border-primary/20 rounded-xl bg-primary/5 flex items-center justify-center p-6 text-center shadow-md">
            <p className="text-lg text-muted-foreground">{back}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
