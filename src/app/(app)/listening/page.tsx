
"use client"

import * as React from "react"
import { useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Volume2, CheckCircle, XCircle, Loader2, ChevronLeft, BookCheck } from "lucide-react";
import { generateAudio } from "@/lib/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";

type ExerciseType = 'typing' | 'mcq';

interface BaseExercise {
    id: string;
    text: string;
}
interface TypingExercise extends BaseExercise {
    type: 'typing';
}
interface McqExercise extends BaseExercise {
    type: 'mcq';
    options: string[];
    answer: string;
}

type Exercise = TypingExercise | McqExercise;

interface LessonUnit {
    unit: string;
    exercises: Exercise[];
}

const lessons: LessonUnit[] = [
    {
        unit: "Unit 1: Basic Greetings",
        exercises: [
            { id: "u1e1", type: "typing", text: "Hello, how are you?" },
            { id: "u1e2", type: "mcq", text: "My name is John.", options: ["My name is John.", "My name is Jane.", "His name is John."], answer: "My name is John." },
            { id: "u1e3", type: "typing", text: "It is a pleasure to meet you." },
        ],
    },
    {
        unit: "Unit 2: Everyday Objects",
        exercises: [
            { id: "u2e1", type: "mcq", text: "The cat is sleeping on the sofa.", options: ["The dog is sleeping on the sofa.", "The cat is sleeping on the sofa.", "The cat is playing on the sofa."], answer: "The cat is sleeping on the sofa." },
            { id: "u2e2", type: "typing", text: "There is a book on the table." },
            { id: "u2e3", type: "mcq", text: "She opened the window to get some fresh air.", options: ["She closed the window.", "He opened the window.", "She opened the window to get some fresh air."], answer: "She opened the window to get some fresh air." },
        ],
    },
];

export default function ListeningPage() {
    const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
    const [answer, setAnswer] = useState("");
    const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const { toast } = useToast();
    const { userProfile, saveListeningScore } = useAuth();

    const handlePlayAudio = async () => {
        if (!activeExercise) return;
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play();
            return;
        }

        setIsGeneratingAudio(true);
        try {
            const response = await generateAudio(activeExercise.text);
            if (response.media) {
                setAudioUrl(response.media);
                const audio = new Audio(response.media);
                audio.play();
            }
        } catch (error: any) {
            console.error("Audio generation failed:", error);
             if (error.message && error.message.includes('overloaded')) {
                toast({
                    title: "AI is busy",
                    description: "The AI is currently overloaded. Please try again in a moment.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Audio Generation Failed",
                    description: "Could not generate audio for this sentence. Please try again.",
                    variant: "destructive",
                });
            }
        } finally {
            setIsGeneratingAudio(false);
        }
    };
    
    const checkAnswer = async () => {
        if (!activeExercise) return;
        let isCorrect = false;
        if (activeExercise.type === 'typing') {
            isCorrect = answer.trim().toLowerCase() === activeExercise.text.toLowerCase();
        } else if (activeExercise.type === 'mcq') {
            isCorrect = answer === activeExercise.answer;
        }
        setResult(isCorrect ? "correct" : "incorrect");
        if (isCorrect) {
            const xpGained = await saveListeningScore(activeExercise.id, true);
            if (xpGained > 0) {
                 toast({
                    title: "Correct!",
                    description: `You've earned ${xpGained} XP.`,
                });
            }
        }
    };

    const handleSelectExercise = (exercise: Exercise) => {
        setActiveExercise(exercise);
        setAnswer("");
        setResult(null);
        setAudioUrl(null);
    };
    
    const handleBackToList = () => {
        setActiveExercise(null);
    }

    const getUnitProgress = (unitExercises: Exercise[]) => {
        if (!userProfile?.listeningScores) return 0;
        const completedCount = unitExercises.filter(exercise => 
            userProfile.listeningScores?.[exercise.id]
        ).length;
        return (completedCount / unitExercises.length) * 100;
    }

    const renderExercise = () => {
        if (!activeExercise) return null;

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
                <CardContent className="space-y-4">
                     <p>Click the button to listen, then complete the task below.</p>
                     <Button variant="outline" onClick={handlePlayAudio} disabled={isGeneratingAudio}>
                        {isGeneratingAudio ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Volume2 className="mr-2 h-5 w-5" />}
                        {audioUrl ? "Play Again" : "Play Audio"}
                     </Button>
                    {activeExercise.type === 'typing' && (
                        <Input
                            placeholder="Type what you hear..."
                            value={answer}
                            onChange={(e) => { setAnswer(e.target.value); setResult(null); }}
                        />
                    )}
                    {activeExercise.type === 'mcq' && (
                        <RadioGroup value={answer} onValueChange={(value) => { setAnswer(value); setResult(null); }}>
                            {(activeExercise as McqExercise).options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option} id={`option-${index}`} />
                                    <Label htmlFor={`option-${index}`}>{option}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                    <Button onClick={checkAnswer} disabled={!answer} className="bg-accent hover:bg-accent/90">Check Answer</Button>
                    {result === 'correct' && <div className="flex items-center text-green-600"><CheckCircle className="mr-2 h-5 w-5" /> Correct! Well done.</div>}
                    {result === 'incorrect' && (
                         <div className="flex items-center text-destructive">
                            <XCircle className="mr-2 h-5 w-5" /> 
                            Not quite. The correct answer was: "{activeExercise.type === 'typing' ? activeExercise.text : (activeExercise as McqExercise).answer}"
                        </div>
                    )}
                </CardFooter>
            </Card>
        );
    }

    const renderLessonList = () => {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Choose a Lesson</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {lessons.map((lesson, index) => {
                            const progress = getUnitProgress(lesson.exercises);
                            return (
                            <AccordionItem value={`item-${index}`} key={lesson.unit}>
                                <AccordionTrigger>
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
                                        {lesson.exercises.map((exercise, sIndex) => {
                                            const isCompleted = userProfile?.listeningScores?.[exercise.id];
                                            return (
                                            <li key={sIndex} className="flex flex-col md:flex-row justify-between items-start md:items-center p-2 rounded-md hover:bg-muted">
                                                <p className="flex-1 mr-4 text-muted-foreground mb-2 md:mb-0">
                                                    Exercise {sIndex + 1}: {exercise.type === 'mcq' ? 'Multiple Choice' : 'Type the sentence'}
                                                </p>
                                                <div className="flex items-center gap-4">
                                                    {isCompleted ? (
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                                                            <CheckCircle className="h-4 w-4" />
                                                            <span>Completed</span>
                                                        </div>
                                                    ) : <div className="w-[100px] md:w-[110px]"></div>}
                                                    <Button variant="outline" size="sm" onClick={() => handleSelectExercise(exercise)}>
                                                        <BookCheck className="mr-2 h-4 w-4" />
                                                        Practice
                                                    </Button>
                                                </div>
                                            </li>
                                        )})}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        )})}
                    </Accordion>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <PageHeader
                title="Listening Practice"
                description="Listen to the audio and complete the exercises to test your comprehension."
            />
            {activeExercise ? renderExercise() : renderLessonList()}
        </>
    );
}
