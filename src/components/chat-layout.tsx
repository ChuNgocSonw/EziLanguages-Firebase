"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, MessageSquare, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInterface from "@/components/chat-interface";
import { useAuth } from "@/hooks/use-auth";
import type { ChatSession } from "@/lib/types";
import { cn } from "@/lib/utils";
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

export default function ChatLayout() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const { getChatList, deleteChatSession } = useAuth();
  const { toast } = useToast();

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

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChatToDelete(chatId);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;
    try {
      await deleteChatSession(chatToDelete);
      toast({
        title: "Chat Deleted",
        description: "The chat session has been successfully deleted.",
      });
      setChatToDelete(null);
      if (selectedChatId === chatToDelete) {
        setSelectedChatId(null);
      }
      fetchChats();
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Could not delete the chat session. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
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
                  <div key={chat.id} className="relative group">
                    <button
                      onClick={() => handleSelectChat(chat.id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-muted-foreground transition-all hover:bg-muted hover:text-primary",
                        selectedChatId === chat.id && "bg-muted text-primary font-semibold"
                      )}
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span className="truncate flex-1">{chat.title}</span>
                    </button>
                    <AlertDialogTrigger asChild>
                       <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteClick(e, chat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </AlertDialogTrigger>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        <div className="flex flex-col h-full">
          <ChatInterface chatId={selectedChatId} onNewChat={handleNewChatCreated} />
        </div>
      </div>
      <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the chat session and all of its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChatToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
