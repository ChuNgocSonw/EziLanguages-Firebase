
"use client";

import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { analyzePronunciation } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

const practiceSentences = [
    { unit: "Unit 1: Greetings", text: "Hello, how are you doing today?" },
    { unit: "Unit 1: Greetings", text: "It's a pleasure to meet you." },
    { unit: "Unit 2: Daily Activities", text: "I usually wake up early in the morning." },
    { unit: "Unit 2: Daily Activities", text: "She is currently working on a very important project." },
    { unit: "Unit 3: Complex Sounds", text: "The quick brown fox jumps over the lazy dog near the river bank." },
];


type PronunciationResult = {
  score: number;
  words: { word: string; correct: boolean }[];
  transcribedText: string;
};

export default function ReadingPage() {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const currentSentence = practiceSentences[currentSentenceIndex];

  // Reset result when sentence changes
  useEffect(() => {
    setResult(null);
  }, [currentSentenceIndex]);


  const handleStartRecording = async () => {
    setResult(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        mediaRecorderRef.current.onstop = async () => {
          setIsLoading(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
                const analysisResult = await analyzePronunciation({
                    audioDataUri: base64Audio,
                    referenceText: currentSentence.text,
                });
                setResult(analysisResult);
            } catch (error) {
                console.error("Pronunciation analysis failed:", error);
                toast({
                    title: "Analysis Failed",
                    description: "Could not analyze the audio. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
          };
          audioChunksRef.current = [];
          // Stop all media tracks to turn off the recording indicator
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

  const goToNextSentence = () => {
    setCurrentSentenceIndex((prev) => (prev + 1) % practiceSentences.length);
  };

  const goToPreviousSentence = () => {
    setCurrentSentenceIndex((prev) => (prev - 1 + practiceSentences.length) % practiceSentences.length);
  };

  return (
    <>
      <PageHeader
        title="Reading & Pronunciation"
        description="Read the sentence below and get feedback on your pronunciation."
      />

      <Card>
        <CardHeader>
          <CardTitle>Practice Sentence</CardTitle>
          <p className="text-sm text-muted-foreground">{currentSentence.unit} - Sentence {currentSentenceIndex + 1} of {practiceSentences.length}</p>
        </CardHeader>
        <CardContent>
          {!result ? (
            <p className="text-xl font-headline tracking-wide leading-relaxed">
              {currentSentence.text}
            </p>
          ) : (
            <p className="text-xl font-headline tracking-wide leading-relaxed">
              {result.words.map((word, index) => (
                <span
                  key={index}
                  className={!word.correct ? "text-destructive underline decoration-wavy" : ""}
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
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousSentence} disabled={isRecording || isLoading}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" size="icon" onClick={goToNextSentence} disabled={isRecording || isLoading}>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
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
                    <p className="text-muted-foreground italic">"{result.transcribedText}"</p>
                </div>
             </div>
          )}
        </CardFooter>
      </Card>
    </>
  );
}
