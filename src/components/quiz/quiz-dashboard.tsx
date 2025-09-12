
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { QuizAttempt } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Loader2, PlusCircle, ChevronLeft, Check, X, BookOpen } from "lucide-react";
import { format } from 'date-fns';
import QuizSession from "./quiz-session";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

export default function QuizDashboard() {
  const [view, setView] = useState<"dashboard" | "new_quiz" | "review_quiz">("dashboard");
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getQuizHistory } = useAuth();

  useEffect(() => {
    if (view === "dashboard") {
      const fetchHistory = async () => {
        setIsLoading(true);
        try {
          const history = await getQuizHistory();
          setQuizHistory(history);
        } catch (error) {
          console.error("Failed to fetch quiz history:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    }
  }, [view, getQuizHistory]);
  
  const handleStartNewQuiz = () => {
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
    return <QuizSession onQuizFinish={handleBackToDashboard} />;
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

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
            <CardTitle>Quiz History</CardTitle>
            <CardDescription>Review your past quizzes or start a new one.</CardDescription>
        </div>
        <Button onClick={handleStartNewQuiz} className="bg-accent hover:bg-accent/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Quiz
        </Button>
      </CardHeader>
      <CardContent>
        {quizHistory.length > 0 ? (
          <div className="space-y-3">
            {quizHistory.map((quiz) => (
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
            <p className="text-muted-foreground mt-2">You haven't completed any quizzes yet. Start a new one to test your knowledge!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
