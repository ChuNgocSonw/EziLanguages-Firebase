
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Loader2, BookCheck, X, CheckCircle, PlayCircle, Star, ArrowLeft } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { analyzePronunciation } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import type { PronunciationAttempt, Assignment, ReadingSentence, Lesson } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

// Helper to create a Firestore-safe key from a sentence
const createSafeKey = (sentence: string) => sentence.replace(/[.#$[\]/]/g, '_');

// Reusable component for the core practice UI for a single sentence
function PracticeInterface({ activeSentence, onSaveAttempt, onBack }: {
  activeSentence: ReadingSentence;
  onSaveAttempt: (sentence: string, attempt: PronunciationAttempt) => Promise<number>;
  onBack: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PronunciationAttempt | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  useEffect(() => {
    // Load previous best result if it exists in practice mode
    const bestAttempt = userProfile?.pronunciationScores?.[createSafeKey(activeSentence.text)];
    if (bestAttempt) {
      setResult(bestAttempt);
      if (bestAttempt.audioDataUri) {
        setRecordedAudioUrl(bestAttempt.audioDataUri);
      }
    }
  }, [activeSentence, userProfile]);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

  const handleStartRecording = async () => {
    setResult(null);
    if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const localAudioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(localAudioUrl);
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            setIsLoading(true);
            const base64Audio = reader.result as string;
            try {
              const analysisResult = await analyzePronunciation({
                audioDataUri: base64Audio,
                referenceText: activeSentence.text,
              });
              const resultWithAudio: PronunciationAttempt = { ...analysisResult, audioDataUri: base64Audio };
              setResult(resultWithAudio);
              const xpGained = await onSaveAttempt(activeSentence.text, resultWithAudio);
              if (xpGained > 0) {
                toast({ title: "Perfect!", description: `You've earned ${xpGained} XP for a perfect score.` });
              }
            } catch (error: any) {
              toast({ title: "Analysis Failed", description: "Could not analyze the audio. Please try again.", variant: "destructive" });
            } finally {
              setIsLoading(false);
            }
          };
          audioChunksRef.current = [];
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        toast({ title: "Microphone Error", description: "Could not access the microphone.", variant: "destructive" });
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleRecording = () => isRecording ? handleStopRecording() : handleStartRecording();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Practice Sentence</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{activeSentence.unit}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onBack}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close Practice</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!result ? (
          <p className="text-xl font-headline tracking-wide leading-relaxed">{activeSentence.text}</p>
        ) : (
          <p className="text-xl font-headline tracking-wide leading-relaxed">
            {result.words.map((word, index) => (
              <span key={index} className={!word.correct ? "text-red-500 font-bold" : ""}>{word.word}{' '}</span>
            ))}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={handleToggleRecording} variant="default" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</> : isRecording ? <><MicOff className="mr-2 h-5 w-5" /> Stop</> : <><Mic className="mr-2 h-5 w-5" /> Record</>}
          </Button>
        </div>
        {result && (
          <div className="w-full space-y-4 pt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Pronunciation Score: <span className="text-primary font-bold ml-2">{result.score}%</span></h3>
              <Progress value={result.score} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">What you said:</h3>
              {recordedAudioUrl && !isLoading && <audio controls src={recordedAudioUrl} className="max-w-xs" />}
              <p className="text-muted-foreground italic mt-2">"{result.transcribedText}"</p>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

// Component for assignment mode
export function ReadingAssignmentSession({ assignment, onFinish }: { assignment: Assignment; onFinish: () => void; }) {
    const [activeSentence, setActiveSentence] = useState<ReadingSentence | null>(null);
    const [completedSentences, setCompletedSentences] = useState<string[]>([]);
    const { savePronunciationAttempt, completeAssignment } = useAuth();
    const { toast } = useToast();
    const [isFinishing, setIsFinishing] = useState(false);

    const handleSelectSentence = (sentence: ReadingSentence) => {
        setActiveSentence(sentence);
    };

    const handleBackToList = () => {
        if (activeSentence && !completedSentences.includes(activeSentence.text)) {
            setCompletedSentences(prev => [...prev, activeSentence.text]);
        }
        setActiveSentence(null);
    };
    
    const handleFinishAssignment = async () => {
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
        } finally {
            setIsFinishing(false);
        }
    };

    const isAllCompleted = completedSentences.length === (assignment.readingSentences?.length || 0);

    if (activeSentence) {
        return <PracticeInterface activeSentence={activeSentence} onSaveAttempt={(sentence, attempt) => savePronunciationAttempt(sentence, attempt, false)} onBack={handleBackToList} />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                   <CardTitle>Reading Assignment: {assignment.title}</CardTitle>
                    <Button variant="outline" onClick={onFinish}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Assignments</Button>
                </div>
                <CardDescription>Complete all sentences to finish the assignment.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {assignment.readingSentences?.map((sentence, sIndex) => {
                        const isCompleted = completedSentences.includes(sentence.text);
                        return (
                            <li key={sIndex} className="flex justify-between items-center p-3 rounded-md border hover:bg-muted">
                                <p className="flex-1 mr-4">{sentence.text}</p>
                                <div className="flex items-center gap-2">
                                    {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                                    <Button variant="outline" size="sm" onClick={() => handleSelectSentence(sentence)}>
                                       <Mic className="mr-2 h-4 w-4" /> {isCompleted ? "Practice Again" : "Practice"}
                                    </Button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </CardContent>
            <CardFooter>
                <Button onClick={handleFinishAssignment} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isFinishing || !isAllCompleted}>
                    {isFinishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mark as Complete &amp; Finish
                </Button>
            </CardFooter>
        </Card>
    );
}


// Main page component (Practice Mode)
export default function ReadingPage() {
  const [activeSentence, setActiveSentence] = useState<ReadingSentence | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile, savePronunciationAttempt, getLessons } = useAuth();
  const { toast } = useToast();

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
  
  const handleSelectSentence = (sentence: ReadingSentence) => {
    setActiveSentence(sentence);
  }
  
  const handleClosePractice = () => {
      setActiveSentence(null);
  }

  const getUnitProgress = (unitSentences: ReadingSentence[]) => {
    if (!userProfile?.pronunciationScores) return 0;
    const completedCount = unitSentences.filter(sentence => 
        userProfile.pronunciationScores?.[createSafeKey(sentence.text)] !== undefined
    ).length;
    return (completedCount / unitSentences.length) * 100;
  }

  if (activeSentence) {
      return <PracticeInterface activeSentence={activeSentence} onSaveAttempt={(sentence, attempt) => savePronunciationAttempt(sentence, attempt, true)} onBack={handleClosePractice} />;
  }

  return (
    <>
      <PageHeader
        title="Reading &amp; Pronunciation"
        description="Select a lesson, choose a sentence, and get feedback on your pronunciation."
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
                        const readingSentences = lesson.activities.reading || [];
                        if (readingSentences.length === 0) return null;
                        const progress = getUnitProgress(readingSentences);
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
                                        {readingSentences.map((sentence, sIndex) => {
                                            const safeKey = createSafeKey(sentence.text);
                                            const bestAttempt = userProfile?.pronunciationScores?.[safeKey];
                                            return (
                                                <li key={sIndex} className="flex flex-col p-2 rounded-md hover:bg-muted">
                                                    <p className="flex-1 mr-4 text-muted-foreground mb-2">{sentence.text}</p>
                                                    <div className="flex items-center gap-2 self-end">
                                                        {bestAttempt ? (
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100">
                                                                    {bestAttempt.score}%
                                                                </Badge>
                                                                {bestAttempt.score === 100 && (
                                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100">
                                                                        <Star className="mr-1 h-3 w-3" /> +15 XP
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        ) : <div className="w-1 md:w-auto"></div>}
                                                        <Button variant="outline" size="sm" onClick={() => handleSelectSentence(sentence)}>
                                                            <BookCheck className="mr-2 h-4 w-4" /> {bestAttempt ? "Improve" : "Practice"}
                                                        </Button>
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
              )}
          </CardContent>
      </Card>
    </>
  );
}
