
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInterface from "@/components/chat-interface";
import { useAuth } from "@/hooks/use-auth";
import type { ChatSession } from "@/lib/types";
import { cn } from "@/lib/utils";

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

  const ChatHistoryPanel = () => (
    <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 pb-4">
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
  );

  return (
    <div className="relative h-full">
      <div className="flex flex-col h-full min-h-0">
        <ChatInterface 
          chatId={selectedChatId} 
          onNewChat={handleNewChatCreated} 
          onChatDeleted={handleChatDeleted}
          onNewChatClick={handleNewChat}
          historySheetOpen={isSheetOpen}
          onHistorySheetOpenChange={setIsSheetOpen}
        >
          <ChatHistoryPanel />
        </ChatInterface>
      </div>
    </div>
  );
}
