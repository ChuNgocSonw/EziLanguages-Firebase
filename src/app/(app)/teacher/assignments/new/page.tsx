
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
import { Loader2, ArrowLeft, Wand2, Save, ArrowRight, PlusCircle, Trash2, BookCheck } from "lucide-react";
import { generateQuizQuestions } from "@/lib/actions";
import type { QuizQuestion } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

const detailsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  language: z.enum(["EN", "JP", "KR", "VI"]),
});
type DetailsFormData = z.infer<typeof detailsSchema>;

const questionsSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters."),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  numberOfQuestions: z.coerce.number().min(1, "Must have at least 1 question.").max(10, "Cannot exceed 10 questions per generation."),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
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
  
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);

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

  const { fields, append, remove } = useFieldArray({
    control: questionsForm.control,
    name: "questions",
  });

  const handleDetailsSubmit = (data: DetailsFormData) => {
    setAssignmentDetails(data);
    setStep("questions");
  };

  const handleGenerateQuestions = async () => {
    const { topic, difficulty, numberOfQuestions } = questionsForm.getValues();
    
    const isValid = await questionsForm.trigger(["topic", "difficulty", "numberOfQuestions"]);
    if (!isValid) return;

    setIsGenerating(true);
    setGeneratedQuestions([]);
    try {
      toast({ title: "Generating Questions...", description: "Please wait while the AI creates the quiz questions." });
      const generated = await generateQuizQuestions({ topic, difficulty, numberOfQuestions });

      if (!generated || generated.length === 0) {
        throw new Error("The AI failed to generate questions for this topic.");
      }

      // Filter out questions that are already in the selected list
      const newGenerated = generated.filter(gq => !fields.some(sq => sq.question === gq.question));
      setGeneratedQuestions(newGenerated);

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
  
  const handleAddQuestionToSelection = (question: QuizQuestion, index: number) => {
    append(question);
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSaveAssignment = async (data: QuestionsFormData) => {
    if (!assignmentDetails) return;
    setIsSaving(true);
    
    if (data.questions.length === 0) {
      toast({ title: "No Questions Selected", description: "Please add at least one question to the assignment.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      await createAssignment({
        title: assignmentDetails.title,
        language: assignmentDetails.language,
        questions: data.questions,
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
  };
  
  const QuestionCard = ({ q, index, onAction, actionType }: { q: QuizQuestion, index: number, onAction: (q: QuizQuestion, index: number) => void, actionType: 'add' | 'remove' }) => (
    <div className="p-3 border rounded-md bg-muted/30 relative">
        <p className="font-medium pr-8">{q.question}</p>
        <ul className="text-sm text-muted-foreground mt-2 list-disc pl-5">
            {q.options.map((opt, i) => (
                <li key={i} className={opt === q.answer ? "font-semibold text-primary" : ""}>{opt}</li>
            ))}
        </ul>
        <Button 
            size="icon" 
            variant="ghost" 
            className="absolute top-2 right-2 h-7 w-7" 
            onClick={() => onAction(q, index)}
        >
            {actionType === 'add' ? <PlusCircle className="h-4 w-4 text-green-600" /> : <Trash2 className="h-4 w-4 text-destructive" />}
        </Button>
    </div>
  );

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
                <CardTitle>Step 2: Build Your Assignment</CardTitle>
                <CardDescription>
                  Generate questions with AI and add them to your assignment: "{assignmentDetails?.title}".
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
                          <FormLabel>Number of Questions to Generate</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="10" {...field} />
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
                
                <Separator />
                
                <div className="grid md:grid-cols-2 gap-6">
                    {/* AI-Generated Questions Column */}
                    <div>
                        <h3 className="font-semibold mb-2">AI-Generated Questions</h3>
                        <div className="p-4 border rounded-md h-96 overflow-y-auto space-y-3">
                           {isGenerating && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                           {!isGenerating && generatedQuestions.length === 0 && (
                                <div className="text-center text-muted-foreground pt-12">
                                    <Wand2 className="mx-auto h-8 w-8 mb-2" />
                                    <p>Generated questions will appear here.</p>
                                    <p className="text-xs">Click a question's (+) icon to add it.</p>
                                </div>
                           )}
                           {generatedQuestions.map((q, index) => (
                             <QuestionCard key={`gen-${index}`} q={q} index={index} onAction={handleAddQuestionToSelection} actionType="add" />
                           ))}
                        </div>
                    </div>

                    {/* Selected Questions Column */}
                     <div>
                        <h3 className="font-semibold mb-2">Selected Questions ({fields.length})</h3>
                        <div className="p-4 border rounded-md h-96 overflow-y-auto space-y-3">
                           {fields.length === 0 && (
                                <div className="text-center text-muted-foreground pt-12">
                                    <BookCheck className="mx-auto h-8 w-8 mb-2" />
                                    <p>Your chosen questions will appear here.</p>
                                </div>
                           )}
                           {fields.map((field, index) => (
                               <QuestionCard key={field.id} q={field} index={index} onAction={(_, idx) => remove(idx)} actionType="remove" />
                           ))}
                        </div>
                    </div>
                </div>

              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                    <Button type="submit" disabled={isSaving || fields.length === 0}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {isSaving ? "Saving..." : `Save Assignment (${fields.length} questions)`}
                    </Button>
                     <Button type="button" variant="outline" onClick={handleBackToDetails} disabled={isSaving}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
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
