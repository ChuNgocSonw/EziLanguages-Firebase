
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generateQuizQuestions } from "@/lib/actions";
import type { QuizQuestion } from "@/lib/types";
import { Loader2, ArrowRight, Check, X, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type QuizState = "idle" | "loading" | "active" | "finished";
type Difficulty = "Easy" | "Medium" | "Hard";

interface QuizSessionProps {
    onQuizFinish: () => void;
}

export default function QuizSession({ onQuizFinish }: QuizSessionProps) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { saveQuizAttempt } = useAuth();

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setQuizState("loading");
    try {
      const generatedQuestions = await generateQuizQuestions({ topic, difficulty });
      setQuestions(generatedQuestions);
      setQuizState("active");
      setCurrentQuestionIndex(0);
      setSelectedAnswers([]);
      setSelectedOption(null);
    } catch (error: any) {
        console.error("Failed to generate quiz:", error);
        if (error.message && error.message.includes('overloaded')) {
            toast({
                title: "AI is busy",
                description: "The AI is currently overloaded. Please try again in a moment.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Quiz Generation Failed",
                description: "Could not generate a quiz for this topic. Please try again.",
                variant: "destructive",
            });
        }
        setQuizState("idle");
    }
  };

  const handleFinishQuiz = async (finalAnswers: string[]) => {
    setIsSaving(true);
    const score = finalAnswers.reduce((score, answer, index) => {
      if (answer === questions[index].answer) {
        return score + 1;
      }
      return score;
    }, 0);
    const percentage = Math.round((score / questions.length) * 100);

    try {
        await saveQuizAttempt({
            topic,
            questions,
            selectedAnswers: finalAnswers,
            score,
            percentage,
        });
        toast({
            title: "Quiz Saved!",
            description: "Your quiz results have been saved to your history."
        });
    } catch (error) {
        console.error("Failed to save quiz attempt:", error);
        toast({
            title: "Save Failed",
            description: "Could not save your quiz results. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
        setQuizState("finished");
    }
  }

  const handleNextQuestion = () => {
    if (selectedOption) {
      const newAnswers = [...selectedAnswers, selectedOption];
      setSelectedAnswers(newAnswers);
      setSelectedOption(null);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        handleFinishQuiz(newAnswers);
      }
    }
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      if (answer === questions[index].answer) {
        return score + 1;
      }
      return score;
    }, 0);
  };
  
  if (quizState === "loading") {
    return (
      <Card className="flex flex-col items-center justify-center p-8 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating your quiz on "{topic}"...</p>
      </Card>
    );
  }

  if (quizState === "active" && questions.length > 0) {
    const question = questions[currentQuestionIndex];
    return (
      <Card>
        <CardHeader>
          <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mb-4" />
          <CardTitle className="font-headline text-xl">Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
          <CardDescription className="text-lg pt-2">{question.question}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup onValueChange={setSelectedOption} value={selectedOption ?? ""}>
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={handleNextQuestion} disabled={!selectedOption} className="ml-auto bg-accent hover:bg-accent/90">
            {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish & Save Quiz"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (quizState === "finished") {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Quiz Complete!</CardTitle>
          <CardDescription>You scored</CardDescription>
          <p className="text-5xl font-bold text-primary">{percentage}%</p>
          <p className="text-muted-foreground">({score} out of {questions.length} correct)</p>
        </CardHeader>
        <CardContent>
            <h3 className="font-semibold mb-4 text-center">Review Your Answers</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {questions.map((q, i) => (
                    <div key={i} className="p-2 border rounded-md">
                        <p className="font-medium">{q.question}</p>
                        <p className={cn("text-sm flex items-center gap-2", selectedAnswers[i] === q.answer ? "text-green-600" : "text-destructive")}>
                           {selectedAnswers[i] === q.answer ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                           Your answer: {selectedAnswers[i]}
                        </p>
                         {selectedAnswers[i] !== q.answer && <p className="text-sm text-green-700">Correct answer: {q.answer}</p>}
                    </div>
                ))}
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={onQuizFinish} className="mx-auto" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleGenerateQuiz}>
        <CardHeader>
          <CardTitle className="font-headline">Generate a New Quiz</CardTitle>
          <CardDescription>
            Enter a topic and select a difficulty. Our AI will create the questions for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input 
              id="topic" 
              placeholder="e.g., French Past Tense, Common English Idioms" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <RadioGroup 
              defaultValue="Medium"
              onValueChange={(value: Difficulty) => setDifficulty(value)}
              className="flex items-center gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Easy" id="d-easy" />
                <Label htmlFor="d-easy">Easy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Medium" id="d-medium" />
                <Label htmlFor="d-medium">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Hard" id="d-hard" />
                <Label htmlFor="d-hard">Hard</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="submit" disabled={!topic.trim()} className="bg-accent hover:bg-accent/90">
            Generate Quiz
          </Button>
           <Button variant="outline" onClick={onQuizFinish}>
            Cancel
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
