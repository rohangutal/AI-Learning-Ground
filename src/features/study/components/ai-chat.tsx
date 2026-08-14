"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, User, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlideUp } from "@/components/ui/animations";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useRef, useState } from "react";

export function AiChat() {
  const { currentTopic } = useAppStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        rag: true,
        currentTopic,
      },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const triggerAction = (promptText: string) => {
    setInput(promptText);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full min-h-[500px] border rounded-xl bg-card shadow-sm overflow-hidden">
      {/* Topic banner */}
      {currentTopic && (
        <div className="bg-primary/5 border-b px-4 py-2.5 flex items-center justify-between text-xs text-primary font-medium">
          <span className="flex items-center gap-1.5 truncate">
            <BookOpen className="h-3.5 w-3.5" />
            Focus Topic: <span className="font-bold underline truncate">{currentTopic}</span>
          </span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline-block">Tutor is focused on this topic</span>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-semibold text-base">Your AI Study Partner</h3>
              <p className="text-sm text-muted-foreground">
                {currentTopic 
                  ? `Ask me anything about "${currentTopic}", or get started with the quick actions below!`
                  : "Ask questions, get summaries, or explain complex concepts from your study materials."}
              </p>
            </div>

            {/* Quick Actions based on topic */}
            {currentTopic && (
              <div className="flex flex-col sm:flex-row gap-2 mt-4 max-w-md w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs justify-start h-9 w-full sm:w-auto" 
                  onClick={() => triggerAction(`Explain the core concepts of "${currentTopic}" in simple, plain terms.`)}
                >
                  <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" /> Explain simply
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs justify-start h-9 w-full sm:w-auto"
                  onClick={() => triggerAction(`Give me a memorable real-world analogy for "${currentTopic}".`)}
                >
                  <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" /> Show analogy
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          messages.map((msg: any, index: number) => (
            <SlideUp key={msg.id || index} delay={0.05}>
              <div className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm border",
                  msg.role === "user" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground"
                )}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "rounded-lg px-4 py-2.5 max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed shadow-sm",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {msg.parts?.map((part: any, pIdx: number) => {
                    if (part.type === "text") {
                      return <span key={pIdx}>{part.text}</span>;
                    }
                    return null;
                  })}
                </div>
              </div>
            </SlideUp>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input 
            placeholder={currentTopic ? `Ask about "${currentTopic}"...` : "Ask your AI tutor..."} 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 rounded-full bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/45 text-sm"
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
