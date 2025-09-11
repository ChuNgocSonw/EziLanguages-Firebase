"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizonal, Bot, User, CornerDownLeft, Sparkles } from "lucide-react";
import { correctGrammar } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./ui/card";

interface Message {
  role: "user" | "bot";
  original?: string;
  corrected?: string;
  explanation?: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      corrected: "Hello! How are you today? Let's practice some English.",
      explanation: "This is a standard greeting."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: "user", original: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await correctGrammar({ text: inputValue });
      const botMessage: Message = {
        role: "bot",
        corrected: result.correctedText,
        explanation: result.explanation,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error correcting grammar:", error);
      const errorMessage: Message = {
        role: 'bot',
        corrected: "Sorry, I encountered an error. Please try again.",
        explanation: "There was a technical issue with the AI service."
      }
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <Card className="flex-1 flex flex-col h-full max-h-[calc(100vh-12rem)]">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-4",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "bot" && (
                  <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                    "max-w-md rounded-lg p-3",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}>
                  {message.role === "user" && <p>{message.original}</p>}
                  {message.role === "bot" && (
                    <div className="space-y-2">
                        <p className="font-semibold">{message.corrected}</p>
                        <p className="text-sm text-muted-foreground italic flex items-start gap-2 pt-2">
                          <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{message.explanation}</span>
                        </p>
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                     <AvatarImage src="https://picsum.photos/seed/user/40/40" alt="User" />
                    <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-4 justify-start">
                 <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                  <div className="max-w-md rounded-lg p-3 bg-muted text-foreground">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t bg-card p-4">
          <form onSubmit={handleSendMessage} className="relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="pr-24 min-h-[50px] resize-none"
              disabled={isLoading}
            />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <p className="text-xs text-muted-foreground hidden sm:block">
                  <CornerDownLeft className="inline-block h-3 w-3 mr-1"/>
                  Send
                </p>
                <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="bg-accent hover:bg-accent/90">
                    <SendHorizonal className="h-5 w-5" />
                </Button>
            </div>
          </form>
        </div>
    </Card>
  );
}
