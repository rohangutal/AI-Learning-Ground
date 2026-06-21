"use client";

import { useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlideUp } from "@/components/ui/animations";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi! I'm your AI tutor. Ask me anything about your notes or upload a new document to get started.",
  },
];

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Optimistic user message update
    const newMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    
    // Simulate AI response for now
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "That's a great question! Based on your notes, here is a detailed breakdown..." }
      ]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-xl bg-card shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <SlideUp key={msg.id} delay={0.1}>
            <div className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={cn(
                "rounded-lg px-4 py-2 max-w-[80%] text-sm",
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              )}>
                {msg.content}
              </div>
            </div>
          </SlideUp>
        ))}
      </div>
      <div className="p-4 border-t bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input 
            placeholder="Ask your AI tutor..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-full bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
