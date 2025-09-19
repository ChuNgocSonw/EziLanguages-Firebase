
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { Assignment, QuizAttempt, PronunciationAttempt } from "@/lib/types";
import { Loader2, BookOpen, ChevronLeft, Check, X, Mic, Headphones } from "lucide-react";
import AssignmentSession from "@/components/assignment-session";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Helper to create a Firestore-safe key from a sentence
const createSafeKey = (sentence: string) => sentence.replace(/[.#$[\]/]/g, '_');

function ReviewQuizAssignmentView({ attempt, onBack }: { attempt: QuizAttempt, onBack: () => void }) {
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

function ReviewReadingAssignmentView({ assignment, userScores, onBack }: { assignment: Assignment; userScores: { [key: string]: PronunciationAttempt }; onBack: () => void; }) {
    return (
      <Card>
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="font-headline text-2xl">Review Assignment: {assignment.title}</CardTitle>
                    <CardDescription>
                        A review of your pronunciation on this reading assignment.
                    </CardDescription>
                </div>
                 <Button variant="ghost" size="sm" onClick={onBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Assignments
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <h3 className="font-semibold mb-4 text-center">Your Performance</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {assignment.readingSentences?.map((sentence, i) => {
                    const score = userScores[createSafeKey(sentence.text)];
                    return (
                        <div key={i} className="p-3 border rounded-md bg-muted/50">
                            <p className="font-medium mb-2">{i + 1}. {sentence.text}</p>
                            {score ? (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mic className="h-4 w-4 text-primary" />
                                    <span>Your Best Score:</span>
                                    <span className="font-bold text-primary">{score.score}%</span>
                                </div>
                            ) : (
                                 <p className="text-sm text-muted-foreground">No score recorded for this sentence.</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </CardContent>
      </Card>
    );
}

function ReviewListeningAssignmentView({ assignment, userScores, onBack }: { assignment: Assignment; userScores: { [key: string]: number }; onBack: () => void; }) {
    return (
      <Card>
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="font-headline text-2xl">Review Assignment: {assignment.title}</CardTitle>
                    <CardDescription>
                        A review of your performance on this listening assignment.
                    </CardDescription>
                </div>
                 <Button variant="ghost" size="sm" onClick={onBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Assignments
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <h3 className="font-semibold mb-4 text-center">Your Performance</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {assignment.listeningExercises?.map((exercise, i) => {
                    const wasCorrect = !!userScores[exercise.id];
                    return (
                        <div key={i} className="p-3 border rounded-md bg-muted/50">
                            <p className="font-medium mb-2">{i + 1}. {exercise.text}</p>
                             <div className={cn("text-sm flex items-center gap-2", wasCorrect ? "text-green-600" : "text-destructive")}>
                                {wasCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                You answered this exercise {wasCorrect ? "correctly" : "incorrectly"}.
                            </div>
                        </div>
                    );
                })}
            </div>
        </CardContent>
      </Card>
    );
}


export default function StudentAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [completedScores, setCompletedScores] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isReviewLoading, setIsReviewLoading] = useState<string | null>(null);
    const { userProfile, getStudentAssignments, getAssignmentAttempt, getStudentCompletedAttempts } = useAuth();
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [reviewItem, setReviewItem] = useState<{ type: 'quiz' | 'reading' | 'listening'; data: any } | null>(null);

    const fetchAssignments = useCallback(async () => {
        setIsLoading(true);
        try {
            const [studentAssignments, completedAttempts] = await Promise.all([
                getStudentAssignments(),
                getStudentCompletedAttempts()
            ]);
            
            setAssignments(studentAssignments);

            const scores: Record<string, number> = {};
            completedAttempts.forEach(attempt => {
                if (attempt.assignmentId) {
                    scores[attempt.assignmentId] = attempt.percentage;
                }
            });
            setCompletedScores(scores);

        } catch (error) {
            console.error("Failed to fetch assignments:", error);
        } finally {
            setIsLoading(false);
        }
    }, [getStudentAssignments, getStudentCompletedAttempts]);

    useEffect(() => {
        if (!selectedAssignment && !reviewItem) {
            fetchAssignments();
        }
    }, [fetchAssignments, selectedAssignment, reviewItem]);

    const handleStartAssignment = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
    };
    
    const handleReviewAssignment = async (assignment: Assignment) => {
        setIsReviewLoading(assignment.id);
        try {
            if (assignment.assignmentType === 'quiz') {
                const attempt = await getAssignmentAttempt(assignment.id);
                if (attempt) {
                    setReviewItem({ type: 'quiz', data: attempt });
                }
            } else if (assignment.assignmentType === 'reading') {
                setReviewItem({ type: 'reading', data: assignment });
            } else if (assignment.assignmentType === 'listening') {
                 setReviewItem({ type: 'listening', data: assignment });
            }
        } catch (error) {
            console.error("Could not fetch assignment attempt:", error);
        } finally {
            setIsReviewLoading(null);
        }
    };
    
    const handleBack = () => {
        setSelectedAssignment(null);
        setReviewItem(null);
    }
    
    const completedAssignments = useMemo(() => {
        return assignments.filter(quiz => userProfile?.completedAssignments?.includes(quiz.id));
    }, [assignments, userProfile]);

    const getScoreBadgeClass = (score: number | undefined) => {
        if (score === undefined) return "bg-green-100 text-green-800 border-green-300";
        if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
        if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-300";
        return "bg-red-100 text-red-800 border-red-300";
    }

    const getContentCountText = (assignment: Assignment) => {
        switch (assignment.assignmentType) {
            case 'quiz': return `${assignment.questions?.length || 0} questions`;
            case 'reading': return `${assignment.readingSentences?.length || 0} sentences`;
            case 'listening': return `${assignment.listeningExercises?.length || 0} exercises`;
            default: return '';
        }
    };


    if (selectedAssignment) {
        return <AssignmentSession assignment={selectedAssignment} onFinish={handleBack} />;
    }

    if (reviewItem) {
        switch (reviewItem.type) {
            case 'quiz':
                return <ReviewQuizAssignmentView attempt={reviewItem.data} onBack={handleBack} />;
            case 'reading':
                 return <ReviewReadingAssignmentView assignment={reviewItem.data} userScores={userProfile?.pronunciationScores || {}} onBack={handleBack} />;
            case 'listening':
                return <ReviewListeningAssignmentView assignment={reviewItem.data} userScores={userProfile?.listeningScores || {}} onBack={handleBack} />;
            default:
                return null;
        }
    }

    return (
        <>
            <PageHeader
                title="My Assignments"
                description="Quizzes and tasks assigned to you by your teacher."
            />
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Current Assignments</CardTitle>
                        <CardDescription>
                            Complete these tasks to practice and show your progress.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : assignments.length > 0 ? (
                            <div className="space-y-3">
                                {assignments.map((assignment) => {
                                    const isCompleted = userProfile?.completedAssignments?.includes(assignment.id);
                                    const score = completedScores[assignment.id];
                                    return (
                                        <div key={assignment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-md border hover:bg-muted gap-4">
                                            <div>
                                                <h4 className="font-semibold">{assignment.title}</h4>
                                                <p className="text-sm text-muted-foreground mt-1 capitalize">
                                                    {assignment.assignmentType} &bull; {getContentCountText(assignment)}
                                                </p>
                                            </div>
                                            <div className="shrink-0">
                                                {isCompleted ? (
                                                     <Badge variant="secondary" className={cn("hover:bg-none justify-center w-40", getScoreBadgeClass(score))}>
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Completed {score !== undefined && `- ${score}%`}
                                                    </Badge>
                                                ) : (
                                                    <Button variant="outline" size="sm" onClick={() => handleStartAssignment(assignment)}>
                                                        <BookOpen className="mr-2 h-4 w-4" />
                                                        Start
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
                
                <Card>
                    <CardHeader>
                        <CardTitle>Assignment History</CardTitle>
                        <CardDescription>
                            Review your performance on completed assignments.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : completedAssignments.length > 0 ? (
                            <div className="space-y-3">
                                {completedAssignments.map((assignment) => (
                                    <div key={assignment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-md border hover:bg-muted gap-4">
                                        <div>
                                            <h4 className="font-semibold">{assignment.title}</h4>
                                            <p className="text-sm text-muted-foreground mt-1 capitalize">
                                                {assignment.assignmentType} &bull; {getContentCountText(assignment)}
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                             <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleReviewAssignment(assignment)}
                                                disabled={isReviewLoading === assignment.id}
                                             >
                                                {isReviewLoading === assignment.id ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <BookOpen className="mr-2 h-4 w-4" />
                                                )}
                                                Review
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-semibold">No Completed Assignments</h3>
                                <p className="text-muted-foreground mt-2">Your completed assignments will appear here once you finish them.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
