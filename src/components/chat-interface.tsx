"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizonal, Bot, CornerDownLeft, Sparkles, HelpCircle, Languages, Loader2 } from "lucide-react";
import { chatWithTutor } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import type { ChatMessage } from "@/lib/types";

type ExplanationLanguage = "English" | "Vietnamese";

const suggestedPrompts = [
    "Correct this for me: She don't like coffee.",
    "What does 'eloquent' mean?",
    "How do you say 'good morning' in Japanese?",
];

interface ChatInterfaceProps {
    chatId: string | null;
    onNewChat: () => void;
}

export default function ChatInterface({ chatId, onNewChat }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [explanationLanguage, setExplanationLanguage] = useState<ExplanationLanguage>("English");
  const viewportRef = useRef<HTMLDivElement>(null);
  const { getChatMessages, saveChatMessage } = useAuth();
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);

  useEffect(() => {
    setCurrentChatId(chatId);
    if (chatId) {
        const loadHistory = async () => {
          setIsHistoryLoading(true);
          try {
            const history = await getChatMessages(chatId);
            setMessages(history);
          } catch (error) {
            console.error("Failed to load chat history:", error);
            setMessages([]);
          } finally {
            setIsHistoryLoading(false);
          }
        };
        loadHistory();
    } else {
        setMessages([
          {
            role: 'bot',
            response: "Hello! How can I help you practice your language skills today?",
            explanation: "You can start a conversation, ask for a translation, or ask a vocabulary question.",
            suggestions: suggestedPrompts,
            isCorrection: false,
            isTranslation: false,
            timestamp: new Date() as any, 
          }
        ]);
        setIsHistoryLoading(false);
    }
  }, [chatId, getChatMessages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    let newChatId = currentChatId;

    const userMessage: Omit<ChatMessage, 'id' | 'timestamp'> = { role: "user", original: messageText };
    setMessages((prev) => {
        const updatedMessages = prev.map(msg => ({ ...msg, suggestions: undefined }));
        return [...updatedMessages, { ...userMessage, timestamp: new Date() as any }];
    });
    setInputValue("");
    setIsLoading(true);

    try {
      if (!newChatId) {
        // This is the first message of a new chat
        const result = await saveChatMessage(null, userMessage);
        newChatId = result.chatId;
        setCurrentChatId(newChatId); // Update state for subsequent messages
        onNewChat(); // Notify parent to refresh chat list
      } else {
        await saveChatMessage(newChatId, userMessage);
      }
      
      const aiResult = await chatWithTutor({ text: messageText, language: explanationLanguage });
      
      const botMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        role: "bot",
        response: aiResult.response,
        explanation: aiResult.explanation,
        isCorrection: aiResult.isCorrection,
        isTranslation: aiResult.isTranslation,
      };
      await saveChatMessage(newChatId, botMessage);
      
      const history = await getChatMessages(newChatId);
      setMessages(history);
      
    } catch (error) {
      console.error("Error with AI Tutor:", error);
      if (newChatId) {
        const errorMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
            role: 'bot',
            response: "Sorry, I encountered an error. Please try again.",
            explanation: "There was a technical issue with the AI service.",
            isCorrection: false,
            isTranslation: false,
        }
        await saveChatMessage(newChatId, errorMessage);
        const history = await getChatMessages(newChatId);
        setMessages(history);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
      sendMessage(suggestion);
  }

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
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

  const getBotMessageIcon = (message: ChatMessage) => {
    if (message.isCorrection) return <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />;
    if (message.isTranslation) return <Languages className="h-4 w-4 shrink-0 mt-0.5" />;
    return <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />;
  }

  return (
    <Card className="flex-1 flex flex-col h-full">
        <ScrollArea className="flex-1 p-4" viewportRef={viewportRef}>
          {isHistoryLoading ? (
             <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
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
                          <p className="font-semibold">{message.response}</p>
                          <p className="text-sm text-muted-foreground italic flex items-start gap-2 pt-2">
                            {getBotMessageIcon(message)}
                            <span>{message.explanation}</span>
                          </p>
                          {message.suggestions && (
                              <div className="pt-2">
                                  <p className="text-sm font-medium mb-2">Try asking:</p>
                                  <div className="flex flex-wrap gap-2">
                                      {message.suggestions.map((suggestion, i) => (
                                          <Button
                                              key={i}
                                              variant="outline"
                                              size="sm"
                                              className="text-xs h-auto py-1.5"
                                              onClick={() => handleSuggestionClick(suggestion)}
                                              disabled={isLoading}
                                          >
                                              {suggestion}
                                          </Button>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                    )}
                  </div>
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
          )}
        </ScrollArea>
        <div className="border-t bg-card p-4 space-y-4">
          <form onSubmit={handleSendMessage} className="relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="pr-24 min-h-[50px] resize-none"
              disabled={isLoading || isHistoryLoading}
            />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <p className="text-xs text-muted-foreground hidden sm:block">
                  <CornerDownLeft className="inline-block h-3 w-3 mr-1"/>
                  Send
                </p>
                <Button type="submit" size="icon" disabled={isLoading || isHistoryLoading || !inputValue.trim()} className="bg-accent hover:bg-accent/90">
                    <SendHorizonal className="h-5 w-5" />
                </Button>
            </div>
          </form>
           <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Explanation Language:</Label>
              <RadioGroup 
                value={explanationLanguage}
                className="flex items-center gap-4"
                onValueChange={(value: ExplanationLanguage) => setExplanationLanguage(value)}
                disabled={isLoading || isHistoryLoading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="English" id="lang-en" />
                  <Label htmlFor="lang-en" className="cursor-pointer">English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Vietnamese" id="lang-vi" />
                  <Label htmlFor="lang-vi" className="cursor-pointer">Tiếng Việt</Label>
                </div>
              </RadioGroup>
            </div>
        </div>
    </Card>
  );
}
