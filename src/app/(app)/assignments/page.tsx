
"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { Assignment, QuizAttempt } from "@/lib/types";
import { Loader2, BookCopy, ChevronLeft, Check, X } from "lucide-react";
import QuizSession from "@/components/quiz/quiz-session";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

function ReviewAssignmentView({ attempt, onBack }: { attempt: QuizAttempt, onBack: () => void }) {
    return (
      <Card>
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="font-headline text-2xl">Review Assignment: {attempt.topic}</CardTitle>
                    <CardDescription>
                        Completed on {format(attempt.completedAt.toDate(), 'PPP')}
                    </CardDescription>
                </div>
                 <Button variant="ghost" size="sm" onClick={onBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Assignments
                </Button>
            </div>
            <div className="text-center pt-4">
                 <p className="text-sm text-muted-foreground">You scored</p>
                 <p className="text-5xl font-bold text-primary">{attempt.percentage}%</p>
                 <p className="text-muted-foreground">({attempt.score} out of {attempt.questions.length} correct)</p>
            </div>
        </CardHeader>
        <CardContent>
            <h3 className="font-semibold mb-4 text-center">Your Answers</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {attempt.questions.map((q, i) => (
                    <div key={i} className="p-3 border rounded-md bg-muted/50">
                        <p className="font-medium">{i + 1}. {q.question}</p>
                        <p className={cn("text-sm flex items-center gap-2 mt-2", attempt.selectedAnswers[i] === q.answer ? "text-green-600" : "text-destructive")}>
                           {attempt.selectedAnswers[i] === q.answer ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                           Your answer: {attempt.selectedAnswers[i]}
                        </p>
                         {attempt.selectedAnswers[i] !== q.answer && <p className="text-sm text-green-700 ml-6">Correct answer: {q.answer}</p>}
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    );
}


export default function StudentAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userProfile, getStudentAssignments, getAssignmentAttempt } = useAuth();
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [reviewAttempt, setReviewAttempt] = useState<QuizAttempt | null>(null);

    const fetchAssignments = useCallback(async () => {
        setIsLoading(true);
        try {
            const studentAssignments = await getStudentAssignments();
            setAssignments(studentAssignments);
        } catch (error) {
            console.error("Failed to fetch assignments:", error);
        } finally {
            setIsLoading(false);
        }
    }, [getStudentAssignments]);

    useEffect(() => {
        if (!selectedAssignment && !reviewAttempt) {
            fetchAssignments();
        }
    }, [fetchAssignments, selectedAssignment, reviewAttempt]);

    const handleStartQuiz = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
    };
    
    const handleReviewAssignment = async (assignmentId: string) => {
        setIsLoading(true);
        try {
            const attempt = await getAssignmentAttempt(assignmentId);
            if (attempt) {
                setReviewAttempt(attempt);
            }
        } catch (error) {
            console.error("Could not fetch assignment attempt:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleBack = () => {
        setSelectedAssignment(null);
        setReviewAttempt(null);
    }

    if (selectedAssignment) {
        return <QuizSession assignment={selectedAssignment} onQuizFinish={handleBack} />;
    }
    
    if (reviewAttempt) {
        return <ReviewAssignmentView attempt={reviewAttempt} onBack={handleBack} />
    }

    return (
        <>
            <PageHeader
                title="My Assignments"
                description="Quizzes and tasks assigned to you by your teacher."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Assigned Quizzes</CardTitle>
                    <CardDescription>
                        Complete these quizzes to practice and show your progress.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : assignments.length > 0 ? (
                        <div className="space-y-3">
                            {assignments.map((quiz) => {
                                const isCompleted = userProfile?.completedAssignments?.includes(quiz.id);
                                return (
                                    <div key={quiz.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-md border hover:bg-muted gap-4">
                                        <div>
                                            <h4 className="font-semibold">{quiz.title}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {quiz.questions.length} questions &bull; Language: {quiz.language}
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            {isCompleted ? (
                                                <Button variant="secondary" size="sm" onClick={() => handleReviewAssignment(quiz.id)}>
                                                    <BookCopy className="mr-2 h-4 w-4" />
                                                    Review
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" onClick={() => handleStartQuiz(quiz)}>
                                                    <BookCopy className="mr-2 h-4 w-4" />
                                                    Start Quiz
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-semibold">No Assignments</h3>
                            <p className="text-muted-foreground mt-2">You don't have any assignments from your teacher right now.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
