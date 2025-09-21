
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, MessageSquare, Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInterface from "@/components/chat-interface";
import { useAuth } from "@/hooks/use-auth";
import type { ChatSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ChatLayout() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { getChatList } = useAuth();

  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const chatList = await getChatList();
      setChats(chatList);
    } catch (error) {
      console.error("Failed to fetch chat list:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getChatList]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleNewChat = () => {
    setSelectedChatId(null);
    setIsSheetOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setIsSheetOpen(false);
  };
  
  const handleNewChatCreated = (newChatId: string) => {
    fetchChats().then(() => {
      setSelectedChatId(newChatId);
    });
  }
  
  const handleChatDeleted = () => {
    setSelectedChatId(null);
    fetchChats();
  };

  return (
    <div className="relative h-full">
       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="absolute top-2 left-2 z-10">
            <History className="h-5 w-5" />
            <span className="sr-only">Toggle Chat History</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-4 flex flex-col">
           <h3 className="text-lg font-semibold mb-4">Chat History</h3>
            <Button onClick={handleNewChat} className="bg-accent hover:bg-accent/90">
                <PlusCircle className="mr-2 h-5 w-5" /> New Chat
            </Button>
            <ScrollArea className="flex-1 mt-4 -mx-4">
                <div className="px-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                        {chats.map((chat) => (
                            <button
                            key={chat.id}
                            onClick={() => handleSelectChat(chat.id)}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-primary text-left w-full",
                                selectedChatId === chat.id && "bg-muted text-primary font-semibold"
                            )}
                            >
                            <MessageSquare className="h-5 w-5 shrink-0" />
                            <span className="truncate flex-1 min-w-0">{chat.title}</span>
                            </button>
                        ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="flex flex-col h-full min-h-0">
        <ChatInterface 
          chatId={selectedChatId} 
          onNewChat={handleNewChatCreated} 
          onChatDeleted={handleChatDeleted}
        />
      </div>
    </div>
  );
}
