

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { QuizAttempt } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Loader2, PlusCircle, ChevronLeft, Check, X, BookOpen, Wand2 } from "lucide-react";
import { format } from 'date-fns';
import QuizSession from "./quiz-session";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

export default function QuizDashboard() {
  const [view, setView] = useState<"dashboard" | "new_quiz" | "review_quiz">("dashboard");
  const [startRandomQuiz, setStartRandomQuiz] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const { getQuizHistory } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = await getQuizHistory();
      setQuizHistory(history);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getQuizHistory]);

  useEffect(() => {
    if (view === "dashboard") {
      fetchDashboardData();
    }
  }, [view, fetchDashboardData]);
  
  const handleStartNewQuiz = () => {
    setStartRandomQuiz(false);
    setView("new_quiz");
  };

  const handleStartRandomQuiz = () => {
    setStartRandomQuiz(true);
    setView("new_quiz");
  };

  const handleReviewQuiz = (quiz: QuizAttempt) => {
    setSelectedQuiz(quiz);
    setView("review_quiz");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
    setSelectedQuiz(null);
  };

  if (isLoading && view === "dashboard") {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (view === "new_quiz") {
    return <QuizSession onQuizFinish={handleBackToDashboard} isRandomQuiz={startRandomQuiz} />;
  }

  if (view === "review_quiz" && selectedQuiz) {
    return (
      <Card>
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="font-headline text-2xl">Review Quiz: {selectedQuiz.topic}</CardTitle>
                    <CardDescription>
                        Completed on {format(selectedQuiz.completedAt.toDate(), 'PPP')}
                    </CardDescription>
                </div>
                 <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to History
                </Button>
            </div>
            <div className="text-center pt-4">
                 <p className="text-sm text-muted-foreground">You scored</p>
                 <p className="text-5xl font-bold text-primary">{selectedQuiz.percentage}%</p>
                 <p className="text-muted-foreground">({selectedQuiz.score} out of {selectedQuiz.questions.length} correct)</p>
            </div>
        </CardHeader>
        <CardContent>
            <h3 className="font-semibold mb-4 text-center">Your Answers</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {selectedQuiz.questions.map((q, i) => (
                    <div key={i} className="p-3 border rounded-md bg-muted/50">
                        <p className="font-medium">{i + 1}. {q.question}</p>
                        <p className={cn("text-sm flex items-center gap-2 mt-2", selectedQuiz.selectedAnswers[i] === q.answer ? "text-green-600" : "text-destructive")}>
                           {selectedQuiz.selectedAnswers[i] === q.answer ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                           Your answer: {selectedQuiz.selectedAnswers[i]}
                        </p>
                         {selectedQuiz.selectedAnswers[i] !== q.answer && <p className="text-sm text-green-700 ml-6">Correct answer: {q.answer}</p>}
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    )
  }
  
  const displayedHistory = showAllHistory ? quizHistory : quizHistory.slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
              <CardTitle>AI Quiz Generator</CardTitle>
              <CardDescription>Generate a new quiz on any topic or try a random one.</CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Button onClick={handleStartNewQuiz} variant="outline" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Quiz
            </Button>
            <Button onClick={handleStartRandomQuiz} className="bg-accent hover:bg-accent/90 w-full">
                <Wand2 className="mr-2 h-4 w-4" />
                Start Random Quiz
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiz History</CardTitle>
          <CardDescription>Review your past quizzes.</CardDescription>
        </CardHeader>
        <CardContent>
          {quizHistory.length > 0 ? (
            <div className="space-y-3">
              {displayedHistory.map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted">
                  <div>
                    <h4 className="font-semibold">{quiz.topic}</h4>
                    <p className="text-sm text-muted-foreground">
                      Completed on {format(quiz.completedAt.toDate(), 'PPP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={quiz.percentage > 70 ? "default" : "secondary"} className={cn(quiz.percentage <= 70 && "bg-yellow-500 text-black", quiz.percentage < 50 && "bg-destructive text-destructive-foreground")}>{quiz.percentage}%</Badge>
                    <Button variant="outline" size="sm" onClick={() => handleReviewQuiz(quiz)}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold">No Quiz History</h3>
              <p className="text-muted-foreground mt-2">You haven't completed any quizzes yet.</p>
            </div>
          )}
        </CardContent>
        {quizHistory.length > 5 && (
          <CardFooter>
            <Button
              variant="link"
              className="w-full"
              onClick={() => setShowAllHistory(prev => !prev)}
            >
              {showAllHistory ? "Show Less" : "Show More"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
