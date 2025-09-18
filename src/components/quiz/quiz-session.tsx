
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generateQuizQuestions } from "@/lib/actions";
import type { QuizQuestion, Assignment } from "@/lib/types";
import { Loader2, ArrowRight, Check, X, RefreshCw, BookCopy, Pilcrow, ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lessonsData } from "@/lib/lessons";


type QuizState = "idle" | "loading" | "active" | "finished";
type Difficulty = "Easy" | "Medium" | "Hard";
type Language = "English" | "Vietnamese";

interface QuizSessionProps {
    onQuizFinish: () => void;
    assignment?: Assignment | null;
    isRandomQuiz?: boolean;
}

const randomEnglishQuizTopics = [
    "Common English Idioms",
    "English Travel Phrases",
    "English Food Vocabulary",
    "English Tones and Pronunciation",
    "Business English for Meetings",
    "Phrasal Verbs with 'Get'",
    "Ordering Food in an English Restaurant",
    "Past, Present, and Future Tenses",
    "False Friends in Spanish and English",
    "Essential English Greetings"
];

const randomVietnameseQuizTopics = [
    "Thành ngữ Tiếng Anh thông dụng",
    "Cụm từ du lịch bằng Tiếng Anh",
    "Từ vựng Tiếng Anh về đồ ăn",
    "Trọng âm và phát âm Tiếng Anh",
    "Tiếng Anh thương mại cho các cuộc họp",
    "Cụm động từ với 'Get'",
    "Đặt món ăn trong nhà hàng bằng Tiếng Anh",
    "Thì quá khứ, hiện tại và tương lai",
    "Những từ dễ nhầm lẫn trong Tiếng Việt và Tiếng Anh",
    "Lời chào hỏi cần thiết bằng Tiếng Anh"
];


export default function QuizSession({ onQuizFinish, assignment = null, isRandomQuiz = false }: QuizSessionProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [quizTopic, setQuizTopic] = useState(""); // This will store the final topic for the summary page
  const { toast } = useToast();
  const { saveQuizAttempt } = useAuth();
  
  useEffect(() => {
    if (assignment) {
      setQuestions(assignment.questions);
      setQuizTopic(assignment.title);
      setQuizState("active");
    } else {
      setQuizState("idle");
    }
  }, [assignment]);


  const startQuizGeneration = async (generationParams: { topic: string; difficulty: Difficulty; numberOfQuestions: number; displayTopic: string; language: Language; }) => {
    const { topic, difficulty, numberOfQuestions, displayTopic, language } = generationParams;

    if (!topic.trim()) return;

    setQuizState("loading");
    setQuizTopic(displayTopic); // Use the user-friendly name for display

    try {
      const generatedQuestions = await generateQuizQuestions({ topic, difficulty, numberOfQuestions, questionType: 'multiple-choice', language });
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error("The AI failed to generate questions for this topic.");
      }
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
      if (answer.trim().toLowerCase() === questions[index].answer.trim().toLowerCase()) {
        return score + 1;
      }
      return score;
    }, 0);
    const percentage = Math.round((score / questions.length) * 100);

    try {
        const xpGained = await saveQuizAttempt({
            topic: quizTopic,
            questions,
            selectedAnswers: finalAnswers,
            score,
            percentage,
            assignmentId: assignment?.id,
        });
        toast({
            title: "Quiz Saved!",
            description: `Your results have been saved. You earned ${xpGained} XP!`,
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
      if (answer.trim().toLowerCase() === questions[index].answer.trim().toLowerCase()) {
        return score + 1;
      }
      return score;
    }, 0);
  };
  
  const TopicGenerationForm = ({ difficulty, setDifficulty, numberOfQuestions, setNumberOfQuestions, onGenerate }: {
      difficulty: Difficulty;
      setDifficulty: (d: Difficulty) => void;
      numberOfQuestions: number;
      setNumberOfQuestions: (n: number) => void;
      onGenerate: (topic: string, displayTopic: string, language: Language) => void;
  }) => {
    const [topic, setTopic] = useState("");
    const [language, setLanguage] = useState<Language>("English");
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(topic, topic, language);
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6 px-1">
                 <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="topic">Topic</Label>
                        <Input 
                            id="topic" 
                            placeholder="e.g., English Past Tense or Common Vietnamese Phrases" 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="language-select">Language</Label>
                        <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                            <SelectTrigger id="language-select">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <SharedGenerationOptions 
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    numberOfQuestions={numberOfQuestions}
                    setNumberOfQuestions={setNumberOfQuestions}
                />
            </CardContent>
            <CardFooter className="px-1">
                <Button type="submit" disabled={!topic.trim()} className="w-full bg-accent hover:bg-accent/90">
                    Generate Quiz
                </Button>
            </CardFooter>
        </form>
    );
  };

  const LessonGenerationForm = ({ difficulty, setDifficulty, numberOfQuestions, setNumberOfQuestions, onGenerate }: {
      difficulty: Difficulty;
      setDifficulty: (d: Difficulty) => void;
      numberOfQuestions: number;
      setNumberOfQuestions: (n: number) => void;
      onGenerate: (topic: string, displayTopic: string, language: Language) => void;
  }) => {
      const [lessonContent, setLessonContent] = useState("");
      const [lessonTitle, setLessonTitle] = useState("");

      const handleLessonChange = (value: string) => {
          const selectedLesson = lessonsData.find(lesson => lesson.id === value);
          if (selectedLesson) {
              setLessonContent(selectedLesson.content);
              setLessonTitle(selectedLesson.unit);
          }
      };
      
      const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          onGenerate(lessonContent, lessonTitle, 'English');
      };

      return (
         <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6 px-1">
                 <div className="space-y-2">
                    <Label htmlFor="lesson">Select a Lesson</Label>
                    <Select onValueChange={handleLessonChange}>
                        <SelectTrigger><SelectValue placeholder="Choose a lesson to generate a quiz..." /></SelectTrigger>
                        <SelectContent>
                            {lessonsData.map(lesson => (
                                <SelectItem key={lesson.id} value={lesson.id}>
                                    {lesson.unit}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <SharedGenerationOptions 
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    numberOfQuestions={numberOfQuestions}
                    setNumberOfQuestions={setNumberOfQuestions}
                 />
            </CardContent>
            <CardFooter className="px-1">
                <Button type="submit" disabled={!lessonContent.trim()} className="w-full bg-accent hover:bg-accent/90">
                    Generate Quiz
                </Button>
            </CardFooter>
        </form>
      );
  };

  const SharedGenerationOptions = ({ difficulty, setDifficulty, numberOfQuestions, setNumberOfQuestions }: {
      difficulty: Difficulty;
      setDifficulty: (d: Difficulty) => void;
      numberOfQuestions: number;
      setNumberOfQuestions: (n: number) => void;
  }) => (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label>Difficulty</Label>
            <RadioGroup 
            value={difficulty}
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
        <div className="space-y-2">
            <Label htmlFor="num-questions">Number of Questions</Label>
            <Input
                id="num-questions"
                type="number"
                value={numberOfQuestions}
                onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val > 30) setNumberOfQuestions(30);
                    else if (val < 1) setNumberOfQuestions(1);
                    else setNumberOfQuestions(val);
                }}
                min="1"
                max="30"
            />
        </div>
      </div>
  );


  if (quizState === "loading") {
    return (
      <Card className="flex flex-col items-center justify-center p-8 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground text-center">Generating your quiz on "{quizTopic}"...</p>
      </Card>
    );
  }

  if (quizState === "active" && questions.length > 0) {
    const question = questions[currentQuestionIndex];
    return (
      <Card>
        <CardHeader>
          {assignment && (
            <div className="mb-2 text-sm font-semibold text-primary">
              Assignment: {assignment.title}
            </div>
          )}
          <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mb-4" />
          <CardTitle className="font-headline text-xl">Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
          <CardDescription className="text-lg pt-2">{question.question}</CardDescription>
        </CardHeader>
        <CardContent>
          {question.type === 'multiple-choice' && (
            <RadioGroup onValueChange={setSelectedOption} value={selectedOption ?? ""}>
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
          {question.type === 'true-false' && (
              <RadioGroup onValueChange={setSelectedOption} value={selectedOption ?? ""}>
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors">
                      <RadioGroupItem value="True" id="option-true" />
                      <Label htmlFor="option-true" className="flex-1 cursor-pointer">True</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors">
                      <RadioGroupItem value="False" id="option-false" />
                      <Label htmlFor="option-false" className="flex-1 cursor-pointer">False</Label>
                  </div>
              </RadioGroup>
          )}
          {question.type === 'fill-in-the-blank' && (
              <Input
                  placeholder="Type your answer here..."
                  onChange={(e) => setSelectedOption(e.target.value)}
                  value={selectedOption ?? ""}
              />
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleNextQuestion} disabled={!selectedOption} className="bg-accent hover:bg-accent/90">
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
            <div className="space-y-4">
                {questions.map((q, i) => (
                    <div key={i} className="p-2 border rounded-md">
                        <p className="font-medium">{q.question}</p>
                        <p className={cn("text-sm flex items-center gap-2", selectedAnswers[i].trim().toLowerCase() === q.answer.trim().toLowerCase() ? "text-green-600" : "text-destructive")}>
                           {selectedAnswers[i].trim().toLowerCase() === q.answer.trim().toLowerCase() ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                           Your answer: {selectedAnswers[i]}
                        </p>
                         {selectedAnswers[i].trim().toLowerCase() !== q.answer.trim().toLowerCase() && <p className="text-sm text-green-700">Correct answer: {q.answer}</p>}
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
  
  const RandomQuizSetup = () => {
    const [language, setLanguage] = useState<Language>("English");

    const handleRandomQuizDifficultySelect = (difficulty: Difficulty) => {
        const topics = language === "English" ? randomEnglishQuizTopics : randomVietnameseQuizTopics;
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        startQuizGeneration({
            topic: randomTopic,
            difficulty: difficulty,
            numberOfQuestions: 5,
            displayTopic: `Random ${language} Quiz`,
            language: language,
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="font-headline">Random Quiz</CardTitle>
                        <CardDescription>
                            Choose a language and difficulty to start a random quiz.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={onQuizFinish}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-8 pt-6">
                <div className="space-y-4 text-center">
                    <Label className="font-semibold text-xl">1. Select a Language</Label>
                     <RadioGroup 
                        value={language}
                        onValueChange={(value: Language) => setLanguage(value)}
                        className="flex items-center gap-6"
                    >
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="English" id="lang-en" className="h-5 w-5" />
                            <Label htmlFor="lang-en" className="text-lg">English</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="Vietnamese" id="lang-vi" className="h-5 w-5" />
                            <Label htmlFor="lang-vi" className="text-lg">Vietnamese</Label>
                        </div>
                    </RadioGroup>
                </div>
                 <div className="space-y-4 text-center">
                    <Label className="font-semibold text-xl">2. Select a Difficulty</Label>
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                        <Button onClick={() => handleRandomQuizDifficultySelect('Easy')} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white text-base py-6">Easy</Button>
                        <Button onClick={() => handleRandomQuizDifficultySelect('Medium')} size="lg" className="w-full bg-accent hover:bg-accent/90 text-base py-6">Medium</Button>
                        <Button onClick={() => handleRandomQuizDifficultySelect('Hard')} size="lg" variant="destructive" className="w-full text-base py-6">Hard</Button>
                    </div>
                 </div>
            </CardContent>
        </Card>
    );
  }

  if (isRandomQuiz) {
    return <RandomQuizSetup />;
  }

  const GenerationWizard = () => {
    const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);
    
    const handleGenerate = (topic: string, displayTopic: string, language: Language) => {
        startQuizGeneration({ topic, difficulty, numberOfQuestions, displayTopic, language });
    };

    return (
       <Tabs defaultValue="topic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topic">
                <Pilcrow className="mr-2 h-4 w-4"/>
                From Topic
            </TabsTrigger>
            <TabsTrigger value="lesson">
                <BookCopy className="mr-2 h-4 w-4"/>
                From Lesson
                </TabsTrigger>
            </TabsList>
            <TabsContent value="topic">
                <TopicGenerationForm 
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    numberOfQuestions={numberOfQuestions}
                    setNumberOfQuestions={setNumberOfQuestions}
                    onGenerate={handleGenerate}
                />
            </TabsContent>
            <TabsContent value="lesson">
                <LessonGenerationForm 
                     difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    numberOfQuestions={numberOfQuestions}
                    setNumberOfQuestions={setNumberOfQuestions}
                    onGenerate={handleGenerate}
                />
            </TabsContent>
        </Tabs>
    );
  }

  return (
    <Card>
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="font-headline">Generate a New Quiz</CardTitle>
                    <CardDescription>
                        Create a quiz by entering a custom topic or by selecting from your lessons.
                    </CardDescription>
                </div>
                 <Button variant="outline" size="sm" onClick={onQuizFinish}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </div>
        </CardHeader>
        <CardContent>
           <GenerationWizard />
        </CardContent>
    </Card>
  );
}

    

