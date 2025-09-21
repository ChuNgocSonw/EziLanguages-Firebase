
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizonal, Bot, CornerDownLeft, Sparkles, HelpCircle, Languages, Loader2, Trash2 } from "lucide-react";
import { chatWithTutor } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { ChatMessage } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";

const suggestedPrompts = [
    "Correct this for me: She don't like coffee.",
    "What does 'eloquent' mean?",
    "Translate 'Chào buổi sáng' to English",
];

interface ChatInterfaceProps {
    chatId: string | null;
    onNewChat: (newChatId: string) => void;
    onChatDeleted: () => void;
}

export default function ChatInterface({ chatId, onNewChat, onChatDeleted }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [explanationLanguage, setExplanationLanguage] = useState("English");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { getChatMessages, saveChatMessage, deleteChatSession } = useAuth();
  const { toast } = useToast();
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
            response: "Hello! How can I help you practice your English skills today?",
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
        onNewChat(newChatId); // Notify parent to refresh and select the new chat
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
      
    } catch (error: any) {
        console.error("Error with AI Tutor:", error);
        if (error.message && error.message.includes('overloaded')) {
            toast({
                title: "AI is busy",
                description: "The AI is currently overloaded. Please try again in a moment.",
                variant: "destructive",
            });
        }
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

  const getBotMessageIcon = (message: ChatMessage) => {
    if (message.isCorrection) return <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />;
    if (message.isTranslation) return <Languages className="h-4 w-4 shrink-0 mt-0.5" />;
    return <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />;
  }

  const handleConfirmDelete = async () => {
    if (!currentChatId) return;
    try {
      await deleteChatSession(currentChatId);
      toast({
        title: "Chat Deleted",
        description: "The chat session has been successfully deleted.",
      });
      onChatDeleted();
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Could not delete the chat session. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="flex-1 flex flex-col h-full overflow-hidden">
        
          <div className="flex items-center justify-between p-2 border-b shrink-0">
             <div className="flex items-center gap-2">
                <Label htmlFor="language-select" className="text-sm font-medium">Explanation Language:</Label>
                <Select value={explanationLanguage} onValueChange={setExplanationLanguage}>
                    <SelectTrigger id="language-select" className="w-[140px]">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {currentChatId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Chat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this chat session and all of its messages.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            )}
          </div>
       
        <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
          <div className="p-2 md:p-4">
            {isHistoryLoading ? (
              <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={cn(
                      "flex items-start gap-3",
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
          </div>
        </ScrollArea>
        <div className="border-t bg-card p-2 md:p-3 space-y-4 shrink-0">
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
                <Button type="submit" size="icon" disabled={isLoading || isHistoryLoading || !inputValue.trim()} className="bg-accent hover:bg-accent/hover">
                    <SendHorizonal className="h-5 w-5" />
                </Button>
            </div>
          </form>
        </div>
    </Card>
  );
}
