"use client";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import React, { useState } from "react";

const sentenceToRead = "The quick brown fox jumps over the lazy dog near the river bank.";

export default function ReadingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<{ score: number; words: { word: string; correct: boolean }[] } | null>(null);

  const handleToggleRecording = () => {
    if (isRecording) {
      // Simulate scoring
      const words = sentenceToRead.split(' ');
      const scoredWords = words.map(word => ({
        word,
        correct: Math.random() > 0.2, // 80% chance of being correct
      }));
      const correctCount = scoredWords.filter(w => w.correct).length;
      const score = Math.round((correctCount / words.length) * 100);
      setResult({ score, words: scoredWords });
    } else {
      setResult(null);
    }
    setIsRecording(!isRecording);
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
        </CardHeader>
        <CardContent>
          {!result ? (
            <p className="text-xl font-headline tracking-wide leading-relaxed">
              {sentenceToRead}
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
        <CardFooter className="flex-col items-start gap-4">
          <Button onClick={handleToggleRecording} variant="default" size="lg" className="bg-accent hover:bg-accent/90">
            {isRecording ? (
              <>
                <MicOff className="mr-2 h-5 w-5" /> Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-5 w-5" /> Start Recording
              </>
            )}
          </Button>
          {result && (
             <div className="w-full">
                <h3 className="text-lg font-semibold mb-2">Pronunciation Score: 
                    <span className="text-primary font-bold ml-2">{result.score}%</span>
                </h3>
                <div className="w-full bg-muted rounded-full h-4">
                    <div className="bg-primary h-4 rounded-full" style={{ width: `${result.score}%` }}></div>
                </div>
             </div>
          )}
        </CardFooter>
      </Card>
    </>
  );
}
