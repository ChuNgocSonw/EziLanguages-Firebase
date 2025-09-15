
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Loader2, BookCheck, X, CheckCircle, PlayCircle, Star } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { analyzePronunciation } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import type { PronunciationAttempt } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const lessons = [
    {
        unit: "Unit 1: Greetings",
        sentences: [
            "Hello, how are you doing today?",
            "It's a pleasure to meet you.",
            "Good morning, I hope you have a wonderful day.",
        ],
    },
    {
        unit: "Unit 2: Daily Activities",
        sentences: [
            "I usually wake up early in the morning.",
            "She is currently working on a very important project.",
            "They are going to the supermarket to buy some groceries.",
        ],
    },
    {
        unit: "Unit 3: Complex Sounds",
        sentences: [
            "The quick brown fox jumps over the lazy dog near the river bank.",
            "She sells seashells by the seashore.",
            "Peter Piper picked a peck of pickled peppers.",
        ],
    },
];

type PracticeSentence = {
    unit: string;
    text: string;
};

// Helper to create a Firestore-safe key from a sentence
const createSafeKey = (sentence: string) => sentence.replace(/[.#$[\]/]/g, '_');


export default function ReadingPage() {
  const [activeSentence, setActiveSentence] = useState<PracticeSentence | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PronunciationAttempt | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { userProfile, savePronunciationAttempt } = useAuth();

  useEffect(() => {
    // Clear local audio URL when sentence changes or practice is closed, but only for blob URLs
    if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
  }, [activeSentence]);

  // Clean up the object URL on unmount
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
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        mediaRecorderRef.current.onstop = async () => {
          if (!activeSentence) return;
          setIsLoading(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          const localAudioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(localAudioUrl);
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
                const analysisResult = await analyzePronunciation({
                    audioDataUri: base64Audio,
                    referenceText: activeSentence.text,
                });
                
                // Add the new audio data to the result before saving and setting state
                const resultWithAudio: PronunciationAttempt = {
                    ...analysisResult,
                    audioDataUri: base64Audio,
                };

                setResult(resultWithAudio);
                const xpGained = await savePronunciationAttempt(activeSentence.text, resultWithAudio);
                
                if (xpGained > 0) {
                    toast({
                        title: "New High Score!",
                        description: `You've earned ${xpGained} XP for improving your score.`,
                    });
                }

            } catch (error: any) {
                console.error("Pronunciation analysis failed:", error);
                if (error.message && error.message.includes('overloaded')) {
                    toast({
                        title: "AI is busy",
                        description: "The AI is currently overloaded. Please try again in a moment.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Analysis Failed",
                        description: "Could not analyze the audio. Please try again.",
                        variant: "destructive",
                    });
                }
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
        console.error("Error accessing microphone:", err);
        toast({
            title: "Microphone Error",
            description: "Could not access the microphone. Please check your browser permissions.",
            variant: "destructive",
        });
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleSelectSentence = (unit: string, text: string) => {
    setActiveSentence({ unit, text });
    // Load previous best result if it exists
    const safeKey = createSafeKey(text);
    const bestAttempt = userProfile?.pronunciationScores?.[safeKey];
    if (bestAttempt) {
        setResult(bestAttempt);
        // Set the audio URL from the saved data URI if it exists
        if (bestAttempt.audioDataUri) {
          setRecordedAudioUrl(bestAttempt.audioDataUri);
        } else {
          setRecordedAudioUrl(null);
        }
    } else {
        setResult(null);
        setRecordedAudioUrl(null);
    }
  }
  
  const handleClosePractice = () => {
      setActiveSentence(null);
      setResult(null);
      if(isRecording) {
        handleStopRecording();
      }
       if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(recordedAudioUrl);
      }
      setRecordedAudioUrl(null);
  }

  const getUnitProgress = (unitSentences: string[]) => {
    if (!userProfile?.pronunciationScores) return 0;
    const completedCount = unitSentences.filter(sentence => {
        const safeKey = createSafeKey(sentence);
        return userProfile.pronunciationScores?.[safeKey] !== undefined;
    }).length;
    return (completedCount / unitSentences.length) * 100;
  }

  return (
    <>
      <PageHeader
        title="Reading & Pronunciation"
        description="Select a lesson, choose a sentence, and get feedback on your pronunciation."
      />
      
      {!activeSentence ? (
        <Card>
            <CardHeader>
                <CardTitle>Choose a Lesson</CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {lessons.map((lesson, index) => {
                        const progress = getUnitProgress(lesson.sentences);
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
                                        {lesson.sentences.map((sentence, sIndex) => {
                                            const safeKey = createSafeKey(sentence);
                                            const bestAttempt = userProfile?.pronunciationScores?.[safeKey];
                                            return (
                                                <li key={sIndex} className="flex flex-col md:flex-row justify-between items-start md:items-center p-2 rounded-md hover:bg-muted">
                                                    <p className="flex-1 mr-4 text-muted-foreground mb-2 md:mb-0">{sentence}</p>
                                                    <div className="flex items-center gap-4">
                                                        {bestAttempt ? (
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                                                                    Best: {bestAttempt.score}%
                                                                </Badge>
                                                                 <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                                                    <Star className="mr-1 h-3 w-3" /> +15 XP
                                                                </Badge>
                                                            </div>
                                                        ) : <div className="w-[180px] md:w-[170px]"></div>}
                                                        <Button variant="outline" size="sm" onClick={() => handleSelectSentence(lesson.unit, sentence)}>
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
            </CardContent>
        </Card>
      ) : (
        <Card>
            <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>Practice Sentence</CardTitle>
                    <p className="text-sm text-muted-foreground">{activeSentence.unit}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClosePractice}>
                    <X className="h-5 w-5"/>
                    <span className="sr-only">Close Practice</span>
                </Button>
            </div>
            </CardHeader>
            <CardContent>
            {!result ? (
                <p className="text-xl font-headline tracking-wide leading-relaxed">
                {activeSentence.text}
                </p>
            ) : (
                <p className="text-xl font-headline tracking-wide leading-relaxed">
                {result.words.map((word, index) => (
                    <span
                    key={index}
                    className={!word.correct ? "text-destructive font-bold" : ""}
                    >
                    {word.word}{' '}
                    </span>
                ))}
                </p>
            )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <Button onClick={handleToggleRecording} variant="default" size="lg" className="bg-accent hover:bg-accent/90" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
                            </>
                        ) : isRecording ? (
                        <>
                            <MicOff className="mr-2 h-5 w-5" /> Stop Recording
                        </>
                        ) : (
                        <>
                            <Mic className="mr-2 h-5 w-5" /> Start Recording
                        </>
                        )}
                    </Button>
                </div>
            
            {result && (
                <div className="w-full space-y-4 pt-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Pronunciation Score: 
                            <span className="text-primary font-bold ml-2">{result.score}%</span>
                        </h3>
                        <div className="w-full bg-muted rounded-full h-4">
                            <div className="bg-primary h-4 rounded-full" style={{ width: `${result.score}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-1">What you said:</h3>
                        <div className="flex items-center gap-4">
                             {recordedAudioUrl && !isLoading && (
                                <audio controls src={recordedAudioUrl} className="max-w-xs" />
                            )}
                        </div>
                        <p className="text-muted-foreground italic mt-2">"{result.transcribedText}"</p>
                    </div>
                </div>
            )}
            </CardFooter>
        </Card>
      )}
    </>
  );
}
