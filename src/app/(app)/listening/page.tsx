
"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Volume2, CheckCircle, XCircle, Loader2, ChevronLeft, BookCheck, Star, ArrowLeft } from "lucide-react";
import { generateAudio } from "@/lib/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ListeningExercise, Lesson, Assignment } from "@/lib/types";
import { cn } from "@/lib/utils";

// Reusable component for a single listening exercise
function ExerciseInterface({ exercise, onCorrect, onIncorrect }: {
    exercise: ListeningExercise;
    onCorrect: () => void;
    onIncorrect: (correctAnswer: string) => void;
}) {
    const [answer, setAnswer] = useState("");
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const { toast } = useToast();

    const handlePlayAudio = async () => {
        if (audioUrl) {
            new Audio(audioUrl).play();
            return;
        }
        setIsGeneratingAudio(true);
        try {
            const response = await generateAudio(exercise.text);
            if (response.media) {
                setAudioUrl(response.media);
                new Audio(response.media).play();
            }
        } catch (error) {
            toast({ title: "Audio Generation Failed", variant: "destructive" });
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const checkAnswer = () => {
        const correctAnswer = exercise.type === 'typing' ? exercise.text : exercise.answer!;
        if (answer.trim().toLowerCase() === correctAnswer.toLowerCase()) {
            onCorrect();
        } else {
            onIncorrect(correctAnswer);
        }
    };

    return (
        <div className="space-y-4">
            <p>Click the button to listen, then complete the task below.</p>
            <Button variant="outline" onClick={handlePlayAudio} disabled={isGeneratingAudio}>
                {isGeneratingAudio ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Volume2 className="mr-2 h-5 w-5" />}
                {audioUrl ? "Play Again" : "Play Audio"}
            </Button>
            {exercise.type === 'typing' && (
                <Input placeholder="Type what you hear..." value={answer} onChange={(e) => setAnswer(e.target.value)} />
            )}
            {exercise.type === 'mcq' && (
                <RadioGroup value={answer} onValueChange={setAnswer}>
                    {exercise.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`}>{option}</Label>
                        </div>
                    ))}
                </RadioGroup>
            )}
            <div className="pt-2">
               <Button onClick={checkAnswer} disabled={!answer} className="bg-accent hover:bg-accent/90 text-accent-foreground">Check Answer</Button>
            </div>
        </div>
    );
}

// Component for assignment mode
export function ListeningAssignmentSession({ assignment, onFinish }: { assignment: Assignment; onFinish: () => void; }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completedExercises, setCompletedExercises] = useState<string[]>([]);
    const [result, setResult] = useState<{ status: 'correct' | 'incorrect'; message: string } | null>(null);
    const { saveListeningScore, completeAssignment } = useAuth();
    const { toast } = useToast();
    const [isFinishing, setIsFinishing] = useState(false);

    const currentExercise = assignment.listeningExercises?.[currentIndex];

    const handleNext = async () => {
        if (currentExercise && !completedExercises.includes(currentExercise.id)) {
            // Save score but don't award XP in assignment mode.
            await saveListeningScore(currentExercise.id, result?.status === 'correct', false);
            setCompletedExercises(prev => [...prev, currentExercise.id]);
        }
        setResult(null);
        if (currentIndex < (assignment.listeningExercises?.length || 0) - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Last question answered, now finish the assignment
            setIsFinishing(true);
            try {
                const xpGained = await completeAssignment(assignment.id);
                toast({
                    title: "Assignment Complete!",
                    description: `Your work has been submitted. You earned ${xpGained} XP!`,
                });
                onFinish();
            } catch (error) {
                 console.error("Failed to complete assignment:", error);
                 toast({
                    title: "Error",
                    description: "Could not submit your assignment. Please try again.",
                    variant: "destructive",
                });
                setIsFinishing(false);
            }
        }
    };

    const handleCorrect = () => {
        setResult({ status: 'correct', message: 'Correct! Well done.' });
    };

    const handleIncorrect = (correctAnswer: string) => {
        setResult({ status: 'incorrect', message: `Not quite. The correct answer was: "${correctAnswer}"` });
    };
    
    if (!currentExercise) {
        return (
            <Card>
                <CardHeader><CardTitle>Assignment Complete</CardTitle></CardHeader>
                <CardContent><p>You have completed all the listening exercises for this assignment.</p></CardContent>
                <CardFooter><Button onClick={onFinish}>Return to Assignments</Button></CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle>Listening Assignment: {assignment.title}</CardTitle>
                    <Button variant="outline" size="sm" onClick={onFinish} className="w-full sm:w-auto">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assignments
                    </Button>
                </div>
                <CardDescription>Exercise {currentIndex + 1} of {assignment.listeningExercises?.length}</CardDescription>
                <Progress value={((currentIndex + 1) / (assignment.listeningExercises?.length || 1)) * 100} />
            </CardHeader>
            <CardContent>
                {!result ? (
                    <ExerciseInterface exercise={currentExercise} onCorrect={handleCorrect} onIncorrect={handleIncorrect} />
                ) : (
                    <div className="space-y-4">
                        <div className={cn("flex items-center", result.status === 'correct' ? 'text-green-600' : 'text-red-500')}>
                            {result.status === 'correct' ? <CheckCircle className="mr-2 h-5 w-5" /> : <XCircle className="mr-2 h-5 w-5" />}
                            {result.message}
                        </div>
                        <Button onClick={handleNext} disabled={isFinishing} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            {isFinishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {currentIndex < (assignment.listeningExercises?.length || 0) - 1 ? "Next Exercise" : "Finish Assignment"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


// Main page component (Practice Mode)
export default function ListeningPage() {
    const [activeExercise, setActiveExercise] = useState<ListeningExercise | null>(null);
    const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { userProfile, saveListeningScore, getLessons } = useAuth();

    useEffect(() => {
        const fetchLessons = async () => {
            setIsLoading(true);
            try {
                const fetchedLessons = await getLessons();
                setLessons(fetchedLessons);
            } catch (error) {
                console.error("Failed to load lessons:", error);
                toast({ title: "Error", description: "Could not load lessons.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchLessons();
    }, [getLessons, toast]);

    const handleCorrect = async () => {
        if (!activeExercise) return;
        setResult("correct");
        const xpGained = await saveListeningScore(activeExercise.id, true, true);
        if (xpGained > 0) {
            toast({ title: "Correct!", description: `You've earned ${xpGained} XP.` });
        }
    };

    const handleIncorrect = () => {
        setResult("incorrect");
    };

    const handleSelectExercise = (exercise: ListeningExercise) => {
        setActiveExercise(exercise);
        setResult(null);
    };
    
    const handleBackToList = () => {
        setActiveExercise(null);
    }
    
    const getUnitProgress = (unitExercises: ListeningExercise[]) => {
        if (!userProfile?.listeningScores) return 0;
        const completedCount = unitExercises.filter(exercise => 
            userProfile.listeningScores?.[exercise.id]
        ).length;
        return (completedCount / unitExercises.length) * 100;
    }

    if (activeExercise) {
        return (
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handleBackToList}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <CardTitle>Listening Exercise</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <ExerciseInterface exercise={activeExercise} onCorrect={handleCorrect} onIncorrect={handleIncorrect} />
                </CardContent>
                 <CardFooter className="flex-col items-start gap-4">
                    {result === 'correct' && <div className="flex items-center text-green-600"><CheckCircle className="mr-2 h-5 w-5" /> Correct! Well done.</div>}
                    {result === 'incorrect' && (
                         <div className="flex items-center text-red-500">
                            <XCircle className="mr-2 h-5 w-5" /> 
                            Not quite. The correct answer was: "{activeExercise.type === 'typing' ? activeExercise.text : (activeExercise as any).answer}"
                        </div>
                    )}
                </CardFooter>
            </Card>
        )
    }

    return (
        <>
            <PageHeader
                title="Listening Practice"
                description="Listen to the audio and complete the exercises to test your comprehension."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Choose a Lesson</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : lessons.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-semibold">No Lessons Available</h3>
                            <p className="text-muted-foreground mt-2">Check back later for new content.</p>
                        </div>
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {lessons.map((lesson, index) => {
                                const listeningExercises = lesson.activities.listening || [];
                                if (listeningExercises.length === 0) return null;
                                const progress = getUnitProgress(listeningExercises);
                                return (
                                <AccordionItem value={`item-${index}`} key={lesson.unit}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full pr-4">
                                            <span className="text-left">{lesson.unit}</span>
                                            <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-48">
                                                <Progress value={progress} className="h-2 w-full" />
                                                <span className="text-sm text-muted-foreground font-normal">{Math.round(progress)}%</span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="space-y-2">
                                            {listeningExercises.map((exercise, sIndex) => {
                                                const xpEarned = userProfile?.listeningScores?.[exercise.id];
                                                return (
                                                <li key={sIndex} className="flex flex-col md:flex-row md:justify-between md:items-center p-2 rounded-md hover:bg-muted">
                                                    <p className="flex-1 mr-4 text-muted-foreground mb-2 md:mb-0">
                                                        Exercise {sIndex + 1}: {exercise.type === 'mcq' ? 'Multiple Choice' : 'Type the sentence'}
                                                    </p>
                                                    <div className="flex items-center gap-4 self-start md:self-center">
                                                        {xpEarned ? (
                                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100">
                                                                <Star className="mr-1 h-3 w-3" /> +{xpEarned} XP
                                                            </Badge>
                                                        ) : <div className="w-[88px] md:w-[88px]"></div>}
                                                        <Button variant="outline" size="sm" onClick={() => handleSelectExercise(exercise)}>
                                                            <BookCheck className="mr-2 h-4 w-4" />
                                                            {xpEarned ? "Practice Again" : "Practice"}
                                                        </Button>
                                                    </div>
                                                </li>
                                            )})}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            )})}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
