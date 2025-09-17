
"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { Assignment } from "@/lib/types";
import { Loader2, BookCopy, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import QuizSession from "@/components/quiz/quiz-session";

export default function StudentAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userProfile, getStudentAssignments } = useAuth();
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

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
        if (!selectedAssignment) {
            fetchAssignments();
        }
    }, [fetchAssignments, selectedAssignment]);

    const handleStartQuiz = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
    };
    
    const handleQuizFinish = () => {
        setSelectedAssignment(null);
    }

    if (selectedAssignment) {
        return <QuizSession assignment={selectedAssignment} onQuizFinish={handleQuizFinish} />;
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
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 pointer-events-none">
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Completed
                                                </Badge>
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
