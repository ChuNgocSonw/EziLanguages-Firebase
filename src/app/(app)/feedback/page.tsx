
"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { Feedback } from "@/lib/types";
import { Loader2, Send, MailOpen, User } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function StudentFeedbackPage() {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getReceivedFeedback, markFeedbackAsRead } = useAuth();
    
    const fetchFeedback = useCallback(async () => {
        setIsLoading(true);
        try {
            const receivedFeedback = await getReceivedFeedback();
            setFeedbackList(receivedFeedback);
        } catch (error) {
            console.error("Failed to fetch feedback:", error);
        } finally {
            setIsLoading(false);
        }
    }, [getReceivedFeedback]);

    useEffect(() => {
        fetchFeedback();
    }, [fetchFeedback]);

    const handleAccordionChange = async (value: string) => {
        // 'value' is the feedback ID of the opened item
        if (value) {
            const feedback = feedbackList.find(f => f.id === value);
            if (feedback && !feedback.isRead) {
                try {
                    await markFeedbackAsRead(value);
                    // Optimistically update the UI
                    setFeedbackList(prev =>
                        prev.map(f => f.id === value ? { ...f, isRead: true } : f)
                    );
                } catch (error) {
                    console.error("Failed to mark feedback as read:", error);
                }
            }
        }
    };

    return (
        <>
            <PageHeader
                title="Your Feedback"
                description="Messages and feedback from your teacher."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Feedback Inbox</CardTitle>
                    <CardDescription>
                        Review personalized feedback from your teacher to help you improve.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : feedbackList.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full" onValueChange={handleAccordionChange}>
                            {feedbackList.map(feedback => (
                                <AccordionItem value={feedback.id} key={feedback.id}>
                                    <AccordionTrigger className="hover:no-underline group">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-3 text-left">
                                                {!feedback.isRead && <Badge className="bg-accent text-accent-foreground">New</Badge>}
                                                <span className="font-semibold group-hover:underline">{feedback.title}</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground font-normal">
                                                <span className="group-hover:underline">{format(feedback.createdAt.toDate(), 'PPP')}</span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="prose dark:prose-invert max-w-none p-2 bg-muted/50 rounded-md">
                                            <p>{feedback.content}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                            <User className="h-3 w-3" /> From: {feedback.teacherName}
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center py-12">
                            <MailOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mt-4">No Feedback Yet</h3>
                            <p className="text-muted-foreground mt-2">Your teacher hasn't sent you any feedback.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
