"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.4,
  ...props
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SlideUp({
  children,
  className,
  delay = 0,
  duration = 0.5,
  yOffset = 20,
  ...props
}: FadeInProps & { yOffset?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: yOffset }}
      transition={{ duration, delay, ease: [0.25, 0.25, 0, 1] }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
