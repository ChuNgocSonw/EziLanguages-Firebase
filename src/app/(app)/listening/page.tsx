"use client"

import * as React from "react"
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Volume2, CheckCircle, XCircle } from "lucide-react";

export default function ListeningPage() {
    const [typingAnswer, setTypingAnswer] = React.useState("");
    const [typingResult, setTypingResult] = React.useState<"correct" | "incorrect" | null>(null);
    const correctTypingAnswer = "The sun rises in the east."

    const [mcqAnswer, setMcqAnswer] = React.useState("");
    const [mcqResult, setMcqResult] = React.useState<"correct" | "incorrect" | null>(null);
    const correctMcqAnswer = "option-2";
    const mcqOptions = [
        { id: "option-1", label: "She is reading a book." },
        { id: "option-2", label: "He is playing the guitar." },
        { id: "option-3", label: "They are watching a movie." },
    ];

    const checkTypingAnswer = () => {
        if (typingAnswer.trim().toLowerCase() === correctTypingAnswer.toLowerCase()) {
            setTypingResult("correct");
        } else {
            setTypingResult("incorrect");
        }
    };
    
    const checkMcqAnswer = () => {
        if (mcqAnswer === correctMcqAnswer) {
            setMcqResult("correct");
        } else {
            setMcqResult("incorrect");
        }
    };

    return (
        <>
            <PageHeader
                title="Listening Practice"
                description="Listen to the audio and complete the exercises to test your comprehension."
            />

            <Tabs defaultValue="type-sentence" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="type-sentence">Type the Sentence</TabsTrigger>
                    <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
                </TabsList>
                <TabsContent value="type-sentence">
                    <Card>
                        <CardHeader>
                            <CardTitle>Exercise 1: Type what you hear</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p>Click the button to listen to the sentence, then type it in the box below.</p>
                            <Button variant="outline"><Volume2 className="mr-2 h-5 w-5" /> Play Audio</Button>
                            <Input 
                                placeholder="Type the sentence here..." 
                                value={typingAnswer} 
                                onChange={(e) => { setTypingAnswer(e.target.value); setTypingResult(null); }}
                            />
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-4">
                            <Button onClick={checkTypingAnswer} className="bg-accent hover:bg-accent/90">Check Answer</Button>
                            {typingResult === 'correct' && <div className="flex items-center text-green-600"><CheckCircle className="mr-2 h-5 w-5" /> Correct! Well done.</div>}
                            {typingResult === 'incorrect' && <div className="flex items-center text-destructive"><XCircle className="mr-2 h-5 w-5" /> Not quite. The correct answer was: "{correctTypingAnswer}"</div>}
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="multiple-choice">
                    <Card>
                        <CardHeader>
                            <CardTitle>Exercise 2: Choose the correct option</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p>Listen to the audio and select the sentence that matches.</p>
                            <Button variant="outline"><Volume2 className="mr-2 h-5 w-5" /> Play Audio</Button>
                             <RadioGroup value={mcqAnswer} onValueChange={(value) => {setMcqAnswer(value); setMcqResult(null); }}>
                                {mcqOptions.map(option => (
                                     <div key={option.id} className="flex items-center space-x-2">
                                        <RadioGroupItem value={option.id} id={option.id} />
                                        <Label htmlFor={option.id}>{option.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-4">
                            <Button onClick={checkMcqAnswer} className="bg-accent hover:bg-accent/90">Check Answer</Button>
                             {mcqResult === 'correct' && <div className="flex items-center text-green-600"><CheckCircle className="mr-2 h-5 w-5" /> Correct! Excellent listening.</div>}
                            {mcqResult === 'incorrect' && <div className="flex items-center text-destructive"><XCircle className="mr-2 h-5 w-5" /> Incorrect. The correct option was #2.</div>}
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}
