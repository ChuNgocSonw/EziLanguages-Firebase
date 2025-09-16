
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
import { Loader2, ArrowLeft, Wand2, Save, RefreshCw, ArrowRight } from "lucide-react";
import { generateQuizQuestions } from "@/lib/actions";
import type { QuizQuestion } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const detailsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  language: z.enum(["EN", "JP", "KR", "VI"]),
});
type DetailsFormData = z.infer<typeof detailsSchema>;

const questionsSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters."),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  numberOfQuestions: z.coerce.number().min(1, "Must have at least 1 question.").max(30, "Cannot exceed 30 questions."),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
    isSelected: z.boolean().default(true),
  })),
});
type QuestionsFormData = z.infer<typeof questionsSchema>;

export default function NewAssignmentPage() {
  const router = useRouter();
  const { createAssignment } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"details" | "questions">("details");
  const [assignmentDetails, setAssignmentDetails] = useState<DetailsFormData | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const detailsForm = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      title: "",
      language: "EN",
    },
  });

  const questionsForm = useForm<QuestionsFormData>({
    resolver: zodResolver(questionsSchema),
    defaultValues: {
      topic: "",
      difficulty: "Medium",
      numberOfQuestions: 5,
      questions: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: questionsForm.control,
    name: "questions",
  });

  const handleDetailsSubmit = (data: DetailsFormData) => {
    setAssignmentDetails(data);
    setStep("questions");
  };

  const handleGenerateQuestions = async () => {
    const { topic, difficulty, numberOfQuestions } = questionsForm.getValues();
    
    // Trigger validation for generation fields
    const isValid = await questionsForm.trigger(["topic", "difficulty", "numberOfQuestions"]);
    if (!isValid) return;

    setIsGenerating(true);
    try {
      toast({ title: "Generating Questions...", description: "Please wait while the AI creates the quiz questions." });
      const generated = await generateQuizQuestions({ topic, difficulty, numberOfQuestions });

      if (!generated || generated.length === 0) {
        throw new Error("The AI failed to generate questions for this topic.");
      }

      const questionsForReview = generated.map((q, index) => ({
        ...q,
        id: `ai-q-${index}`,
        isSelected: true,
      }));
      replace(questionsForReview);

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
  
  const handleSaveAssignment = async (data: QuestionsFormData) => {
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

  const handleBackToDetails = () => {
    setStep('details');
  }

  return (
    <>
      <PageHeader
        title="Create New Assignment"
        description="Follow the steps to create a new quiz for your students."
      />
       <div className="mb-4">
        <Button variant="outline" onClick={() => router.push('/teacher/assignments')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Assignments
        </Button>
      </div>

      {step === 'details' && (
        <Card>
          <Form {...detailsForm}>
            <form onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)}>
              <CardHeader>
                <CardTitle>Step 1: Assignment Details</CardTitle>
                <CardDescription>
                  Provide a title and language for your new assignment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <FormField control={detailsForm.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Idioms Quiz 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={detailsForm.control} name="language" render={({ field }) => (
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
              </CardContent>
              <CardFooter>
                <Button type="submit">
                  Continue to Questions <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}
      
      {step === 'questions' && (
         <Card>
           <Form {...questionsForm}>
            <form onSubmit={questionsForm.handleSubmit(handleSaveAssignment)}>
              <CardHeader>
                <CardTitle>Step 2: Generate & Select Questions</CardTitle>
                <CardDescription>
                  Use AI to generate questions for your assignment: "{assignmentDetails?.title}".
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                     <FormField control={questionsForm.control} name="topic" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Common English Idioms" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={questionsForm.control} name="difficulty" render={({ field }) => (
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
                    <FormField control={questionsForm.control} name="numberOfQuestions" render={({ field }) => (
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
                  <Button type="button" disabled={isGenerating} onClick={handleGenerateQuestions} className="bg-accent hover:bg-accent/90">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {isGenerating ? "Generating..." : "Generate Questions"}
                  </Button>
                </div>

                {fields.length > 0 && (
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 border rounded-md p-4">
                        <h3 className="font-semibold">Review AI-Generated Questions</h3>
                        {fields.map((field, index) => (
                          <div key={field.id} className="p-3 border rounded-md bg-muted/30">
                             <FormField
                                control={questionsForm.control}
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
                                        <FormLabel className="font-normal text-base">{index + 1}. {questionsForm.getValues(`questions.${index}.question`)}</FormLabel>
                                        <div className="pl-6 pt-2">
                                           <RadioGroup defaultValue={questionsForm.getValues(`questions.${index}.answer`)} disabled>
                                              {questionsForm.getValues(`questions.${index}.options`).map((option, optIndex) => (
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
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                    <Button type="submit" disabled={isSaving || fields.length === 0}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {isSaving ? "Saving..." : `Save Assignment (${questionsForm.watch('questions').filter(q => q.isSelected).length} questions)`}
                    </Button>
                     <Button type="button" variant="outline" onClick={handleBackToDetails} disabled={isSaving}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}
    </>
  );
}

    