
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Wand2, Save, RefreshCw } from "lucide-react";
import { generateQuizQuestions } from "@/lib/actions";
import type { QuizQuestion } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const generationSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters."),
  title: z.string().min(3, "Title must be at least 3 characters."),
  language: z.enum(["EN", "JP", "KR", "VI"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  numberOfQuestions: z.coerce.number().min(1, "Must have at least 1 question.").max(30, "Cannot exceed 30 questions."),
});
type GenerationFormData = z.infer<typeof generationSchema>;

const reviewSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
    isSelected: z.boolean().default(true),
  })),
});
type ReviewFormData = z.infer<typeof reviewSchema>;


export default function NewAssignmentPage() {
  const router = useRouter();
  const { createAssignment } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState<Omit<GenerationFormData, 'topic' | 'numberOfQuestions'> | null>(null);
  const [step, setStep] = useState<"generate" | "review">("generate");

  const generationForm = useForm<GenerationFormData>({
    resolver: zodResolver(generationSchema),
    defaultValues: {
      topic: "",
      title: "",
      language: "EN",
      difficulty: "Medium",
      numberOfQuestions: 5,
    },
  });

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      questions: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: reviewForm.control,
    name: "questions",
  });

  const handleGenerateQuestions = async (data: GenerationFormData) => {
    setIsGenerating(true);
    try {
      toast({ title: "Generating Questions...", description: "Please wait while the AI creates the quiz questions." });
      const questions = await generateQuizQuestions({
        topic: data.topic,
        difficulty: data.difficulty,
        numberOfQuestions: data.numberOfQuestions,
      });

      if (!questions || questions.length === 0) {
        throw new Error("The AI failed to generate questions for this topic.");
      }

      setAssignmentDetails({
        title: data.title,
        language: data.language,
        difficulty: data.difficulty,
      });

      const questionsForReview = questions.map((q, index) => ({
        ...q,
        id: `ai-q-${index}`,
        isSelected: true,
      }));
      replace(questionsForReview);
      
      setStep("review");

    } catch (error: any) {
      console.error("Failed to generate questions:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAssignment = async (data: ReviewFormData) => {
    if (!assignmentDetails) return;
    setIsSaving(true);
    
    const selectedQuestions: QuizQuestion[] = data.questions
      .filter(q => q.isSelected)
      .map(({ question, options, answer }) => ({ question, options, answer }));

    if (selectedQuestions.length === 0) {
      toast({ title: "No Questions Selected", description: "Please select at least one question to save.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      await createAssignment({
        title: assignmentDetails.title,
        language: assignmentDetails.language,
        questions: selectedQuestions,
      });
      toast({ title: "Assignment Created!", description: "The new assignment has been saved successfully." });
      router.push("/teacher/assignments");
    } catch (error: any) {
       console.error("Failed to create assignment:", error);
       toast({ title: "Creation Failed", description: error.message || "An unexpected error occurred.", variant: "destructive", });
    } finally {
       setIsSaving(false);
    }
  };
  
  const handleStartOver = () => {
    setStep('generate');
    setAssignmentDetails(null);
    replace([]);
    generationForm.reset();
  }


  return (
    <>
      <PageHeader
        title="Create New Assignment"
        description="Define the parameters for a new quiz and let AI generate the questions."
      />
       <div className="mb-4">
        <Button variant="outline" onClick={() => router.push('/teacher/assignments')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Assignments
        </Button>
      </div>

      {step === 'generate' && (
        <Card>
          <Form {...generationForm}>
            <form onSubmit={generationForm.handleSubmit(handleGenerateQuestions)}>
              <CardHeader>
                <CardTitle>Step 1: Generate Questions</CardTitle>
                <CardDescription>
                  The AI will generate multiple-choice questions based on the topic and difficulty you provide.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={generationForm.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Idioms Quiz 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={generationForm.control} name="topic" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Common English Idioms" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField control={generationForm.control} name="language" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EN">English</SelectItem>
                            <SelectItem value="JP">Japanese</SelectItem>
                            <SelectItem value="KR">Korean</SelectItem>
                            <SelectItem value="VI">Vietnamese</SelectItem>
                          </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={generationForm.control} name="difficulty" render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Difficulty</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex items-center space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="Easy" /></FormControl>
                              <FormLabel className="font-normal">Easy</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="Medium" /></FormControl>
                              <FormLabel className="font-normal">Medium</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl><RadioGroupItem value="Hard" /></FormControl>
                              <FormLabel className="font-normal">Hard</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={generationForm.control} name="numberOfQuestions" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Questions</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isGenerating} className="bg-accent hover:bg-accent/90">
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  {isGenerating ? "Generating..." : "Generate Questions"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      {step === 'review' && (
        <Card>
           <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit(handleSaveAssignment)}>
              <CardHeader>
                <CardTitle>Step 2: Review and Save</CardTitle>
                <CardDescription>
                  Select the questions you want to include in the assignment "{assignmentDetails?.title}".
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 border rounded-md p-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-3 border rounded-md bg-muted/30">
                         <FormField
                            control={reviewForm.control}
                            name={`questions.${index}.isSelected`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none w-full">
                                    <FormLabel className="font-normal text-base">{index + 1}. {reviewForm.getValues(`questions.${index}.question`)}</FormLabel>
                                    <div className="pl-6 pt-2">
                                       <RadioGroup defaultValue={reviewForm.getValues(`questions.${index}.answer`)} disabled>
                                          {reviewForm.getValues(`questions.${index}.options`).map((option, optIndex) => (
                                              <FormItem key={optIndex} className="flex items-center space-x-2">
                                                  <FormControl>
                                                      <RadioGroupItem value={option} id={`${field.id}-opt-${optIndex}`} />
                                                  </FormControl>
                                                  <FormLabel htmlFor={`${field.id}-opt-${optIndex}`} className="font-normal cursor-not-allowed text-muted-foreground">{option}</FormLabel>
                                              </FormItem>
                                          ))}
                                      </RadioGroup>
                                    </div>
                                </div>
                              </FormItem>
                            )}
                          />
                      </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? "Saving..." : `Save Assignment (${reviewForm.watch('questions').filter(q => q.isSelected).length} questions)`}
                </Button>
                 <Button type="button" variant="outline" onClick={handleStartOver} disabled={isSaving}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Start Over
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}
    </>
  );
}

    