
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInterface from "@/components/chat-interface";
import { useAuth } from "@/hooks/use-auth";
import type { ChatSession } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ChatLayout() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
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
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 h-full">
      <div className="hidden md:flex flex-col gap-4 border-r pr-4">
        <Button onClick={handleNewChat} className="bg-accent hover:bg-accent/90">
          <PlusCircle className="mr-2 h-5 w-5" /> New Chat
        </Button>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col gap-2 pr-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-primary w-full text-left",
                    selectedChatId === chat.id && "bg-muted text-primary font-semibold"
                  )}
                >
                  <MessageSquare className="h-5 w-5 shrink-0" />
                  <span className="truncate flex-1">{chat.title}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      <div className="flex flex-col h-full">
        <ChatInterface 
          chatId={selectedChatId} 
          onNewChat={handleNewChatCreated} 
          onChatDeleted={handleChatDeleted}
        />
      </div>
    </div>
  );
}
