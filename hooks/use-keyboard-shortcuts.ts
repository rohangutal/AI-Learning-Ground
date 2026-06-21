"use client";

import { useEffect } from "react";

interface ShortcutsMap {
  generate?: () => void;
  save?: () => void;
  copy?: () => void;
  clear?: () => void;
  focusInput?: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutsMap, disabled = false) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check target input focus
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement;

      // 1. Ctrl + Enter to Trigger Generation
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (shortcuts.generate) {
          e.preventDefault();
          shortcuts.generate();
        }
      }

      // 2. Ctrl + S to Export PDF
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        if (shortcuts.save) {
          e.preventDefault();
          shortcuts.save();
        }
      }

      // 3. Ctrl + Shift + C to Copy
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        if (shortcuts.copy) {
          e.preventDefault();
          shortcuts.copy();
        }
      }

      // 4. Escape to Clear (only when not editing input)
      if (e.key === "Escape") {
        if (shortcuts.clear && !isInputFocused) {
          e.preventDefault();
          shortcuts.clear();
        }
      }

      // 5. Slash '/' to focus topic input
      if (e.key === "/" && !isInputFocused) {
        if (shortcuts.focusInput) {
          e.preventDefault();
          shortcuts.focusInput();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, disabled]);
}
