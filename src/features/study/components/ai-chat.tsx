"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlideUp } from "@/components/ui/animations";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { MarkdownRenderer } from "@/components/ui/markdown";

export function AiChat({ selectedDocumentId, selectedDocumentName }: { selectedDocumentId: string | null; selectedDocumentName: string | null }) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        rag: true,
        selectedDocumentId,
      }),
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full min-h-[500px] border rounded-xl bg-card shadow-sm overflow-hidden">
      {selectedDocumentName && (
        <div className="flex items-center gap-2 border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Searching selected file: <strong className="font-medium text-foreground">{selectedDocumentName}</strong></span>
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
              <p className="text-sm text-muted-foreground">Ask a question about your uploaded material, or ask for a summary and explanation.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const messageText = msg.parts?.filter((part) => part.type === "text").map((part) => part.text).join("") ?? "";
            return (
            <SlideUp key={msg.id || index} delay={0.05}>
              <div className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm border",
                  msg.role === "user" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground"
                )}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed shadow-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted/50 border text-foreground rounded-tl-sm"
                )}>
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{messageText}</div>
                  ) : (
                    <div className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0">
                      <MarkdownRenderer content={messageText} />
                    </div>
                  )}
                </div>
              </div>
            </SlideUp>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm border bg-muted text-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] bg-muted/50 border text-muted-foreground flex items-center gap-1.5">
              <span className="mr-1">{status === "submitted" ? "Searching your study materials…" : "Preparing your explanation…"}</span>
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce"></span>
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input 
            placeholder={selectedDocumentName ? `Ask about ${selectedDocumentName}...` : "Ask your AI tutor..."}
            value={input || ""}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 rounded-full bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/45 text-sm"
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isLoading || !input?.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
