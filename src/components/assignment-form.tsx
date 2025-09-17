

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import { QuizQuestion, QuizQuestionSchema, QuestionType, Assignment } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const detailsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  language: z.enum(["EN", "JP", "KR", "VI"]),
});
type DetailsFormData = z.infer<typeof detailsSchema>;

const questionsSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});
type QuestionsFormData = z.infer<typeof questionsSchema>;

const generationSchema = z.object({
    topic: z.string().min(3, "Topic must be at least 3 characters."),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    numberOfQuestions: z.coerce.number().min(1, "Must have at least 1 question.").max(10, "Cannot exceed 10 questions per generation."),
    questionType: z.enum(['multiple-choice', 'true-false', 'fill-in-the-blank']),
});
type GenerationFormData = z.infer<typeof generationSchema>;

const manualQuestionSchema = z.object({
    type: z.enum(['multiple-choice', 'true-false', 'fill-in-the-blank']),
    question: z.string().min(5, "Question must be at least 5 characters."),
    options: z.array(z.string()).optional(),
    answer: z.string().min(1, "An answer is required."),
}).refine(data => {
    if (data.type === 'multiple-choice') {
        return data.options && data.options.length === 4 && data.options.every(opt => opt.trim() !== "") && data.options.includes(data.answer);
    }
    if (data.type === 'true-false') {
        return ["True", "False"].includes(data.answer);
    }
    return true;
}, {
    message: "For Multiple Choice, all 4 options are required and the answer must be one of the options.",
    path: ["answer"],
});
type ManualQuestionFormData = z.infer<typeof manualQuestionSchema>;


function QuestionCard({ q, index, onAction, actionType }: { q: QuizQuestion, index: number, onAction: (index: number) => void, actionType: 'add' | 'remove' }) {
    return (
        <div className="p-3 border rounded-md bg-muted/30 relative">
            <p className="font-medium pr-8">{q.question}</p>
            <div className="text-sm text-muted-foreground mt-2">
                {q.type === 'multiple-choice' && (
                    <ul className="list-disc pl-5">
                        {q.options?.map((opt, i) => (
                            <li key={i} className={opt === q.answer ? "font-semibold text-primary" : ""}>{opt}</li>
                        ))}
                    </ul>
                )}
                {q.type === 'true-false' && <p>Answer: <span className="font-semibold text-primary">{q.answer}</span></p>}
                {q.type === 'fill-in-the-blank' && <p>Answer: <span className="font-semibold text-primary">{q.answer}</span></p>}
            </div>
             <Button 
                size="icon" 
                variant="ghost" 
                className={cn(
                    "absolute top-2 right-2 h-7 w-7",
                    actionType === 'add' ? "text-green-600 hover:bg-[#2E7D32] hover:text-white" : "text-destructive hover:bg-[#D32F2F] hover:text-white"
                )}
                onClick={() => onAction(index)}
             >
                {actionType === 'add' ? <PlusCircle className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        </div>
    );
}


function ManualQuestionForm({ onAddQuestion }: { onAddQuestion: (q: QuizQuestion) => void }) {
    const form = useForm<ManualQuestionFormData>({
        resolver: zodResolver(manualQuestionSchema),
        defaultValues: {
            type: 'multiple-choice',
            question: "",
            options: ["", "", "", ""],
            answer: "",
        },
    });

    const questionType = useWatch({ control: form.control, name: 'type' });
    const options = useWatch({ control: form.control, name: 'options' });

    const handleManualSubmit = (data: ManualQuestionFormData) => {
        const finalQuestion: QuizQuestion = {
            id: new Date().getTime().toString(),
            type: data.type,
            question: data.question,
            answer: data.answer,
            options: data.type === 'multiple-choice' ? data.options : [],
        };
        onAddQuestion(finalQuestion);
        form.reset();
    };

    return (
        <Card>
            <CardHeader><CardTitle>Add Question Manually</CardTitle></CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleManualSubmit)} className="space-y-4">
                        <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem><FormLabel>Question Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                        <SelectItem value="true-false">True/False</SelectItem>
                                        <SelectItem value="fill-in-the-blank">Fill-in-the-Blank</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="question" render={({ field }) => (
                            <FormItem><FormLabel>Question Text</FormLabel>
                                <FormControl><Textarea placeholder="Enter the question here..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>

                        {questionType === 'multiple-choice' && (
                            <>
                                {[0, 1, 2, 3].map(i => (
                                    <FormField key={i} control={form.control} name={`options.${i}`} render={({ field }) => (
                                        <FormItem><FormLabel>Option {i + 1}</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                        </FormItem>
                                    )}/>
                                ))}
                                <FormField control={form.control} name="answer" render={({ field }) => (
                                    <FormItem><FormLabel>Correct Answer</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} value={field.value}>
                                                {options?.map((opt, i) => opt.trim() && (
                                                    <FormItem key={i} className="flex items-center space-x-2">
                                                        <FormControl><RadioGroupItem value={opt} /></FormControl>
                                                        <FormLabel className="font-normal">{opt}</FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </>
                        )}

                        {questionType === 'true-false' && (
                           <FormField control={form.control} name="answer" render={({ field }) => (
                                <FormItem><FormLabel>Correct Answer</FormLabel>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl><RadioGroupItem value="True" /></FormControl>
                                            <FormLabel className="font-normal">True</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl><RadioGroupItem value="False" /></FormControl>
                                            <FormLabel className="font-normal">False</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        )}

                        {questionType === 'fill-in-the-blank' && (
                            <FormField control={form.control} name="answer" render={({ field }) => (
                                <FormItem><FormLabel>Correct Answer</FormLabel>
                                    <FormControl><Input placeholder="Enter the word(s) that fill the blank" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        )}
                        <Button type="submit" variant="secondary"><PlusCircle className="mr-2 h-4 w-4" /> Add This Question</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

interface AssignmentFormProps {
    existingAssignment?: Assignment;
}

export default function AssignmentForm({ existingAssignment }: AssignmentFormProps) {
  const router = useRouter();
  const { createAssignment, updateAssignment } = useAuth();
  const { toast } = useToast();

  const isEditMode = !!existingAssignment;
  
  const [step, setStep] = useState<"details" | "questions">(isEditMode ? "questions" : "details");
  const [assignmentDetails, setAssignmentDetails] = useState<DetailsFormData | null>(
      isEditMode ? { title: existingAssignment.title, language: existingAssignment.language } : null
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [allAiQuestions, setAllAiQuestions] = useState<QuizQuestion[]>([]);
  const [availableAiQuestions, setAvailableAiQuestions] = useState<QuizQuestion[]>([]);
  
  const detailsForm = useForm<DetailsFormData>({ 
      resolver: zodResolver(detailsSchema), 
      defaultValues: { 
          title: existingAssignment?.title || "", 
          language: existingAssignment?.language || "EN" 
      } 
  });
  
  const generationForm = useForm<GenerationFormData>({ 
      resolver: zodResolver(generationSchema), 
      defaultValues: { topic: "", difficulty: "Medium", numberOfQuestions: 5, questionType: 'multiple-choice' }
  });
  
  const selectionForm = useForm<QuestionsFormData>({ 
      resolver: zodResolver(questionsSchema), 
      defaultValues: { 
          questions: existingAssignment?.questions || [] 
      } 
  });

  const { fields, append, remove } = useFieldArray({ control: selectionForm.control, name: "questions" });

  useEffect(() => {
    // When all AI questions change, filter out the ones already selected
    const selectedQuestionTexts = new Set(fields.map(q => q.question));
    setAvailableAiQuestions(allAiQuestions.filter(q => !selectedQuestionTexts.has(q.question)));
  }, [allAiQuestions, fields]);


  const handleDetailsSubmit = (data: DetailsFormData) => { setAssignmentDetails(data); setStep("questions"); };
  const handleBackToDetails = () => { setStep('details'); };

  const handleGenerateQuestions = async (data: GenerationFormData) => {
    setIsGenerating(true);
    setAllAiQuestions([]);
    try {
      toast({ title: "Generating Questions...", description: "Please wait while the AI creates the quiz questions." });
      const generated = await generateQuizQuestions(data);
      if (!generated || generated.length === 0) throw new Error("The AI failed to generate questions for this topic.");
      
      const questionsWithIds = generated.map(q => ({ ...q, id: `ai-${new Date().getTime()}-${Math.random()}`}));
      setAllAiQuestions(questionsWithIds);

    } catch (error: any) {
      console.error("Failed to generate questions:", error);
      toast({ title: "Generation Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally { setIsGenerating(false); }
  };
  
  const handleAddQuestionToSelection = (index: number) => {
    const question = availableAiQuestions[index];
    append(question);
  };
  
  const handleRemoveQuestionFromSelection = (index: number) => {
    const removedQuestion = fields[index] as QuizQuestion;
    remove(index);
    if(removedQuestion.id?.startsWith('ai-')) {
        setAllAiQuestions(prev => [...prev, removedQuestion]);
    }
  };

  const handleAddManualQuestion = (question: QuizQuestion) => {
    if (fields.some(q => q.question === question.question)) {
        toast({ title: "Duplicate Question", description: "This question is already in your selected list.", variant: "destructive" });
        return;
    }
    append(question);
    toast({ title: "Question Added", description: "Your manual question has been added to the list." });
  };

  const handleSaveAssignment = async (data: QuestionsFormData) => {
    if (!assignmentDetails) return;
    if (data.questions.length === 0) {
      toast({ title: "No Questions Selected", description: "Please add at least one question to the assignment.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
        const payload = { 
            title: assignmentDetails.title, 
            language: assignmentDetails.language, 
            questions: data.questions 
        };

        if (isEditMode && existingAssignment.id) {
            await updateAssignment(existingAssignment.id, payload);
            toast({ title: "Assignment Updated!", description: "The assignment has been saved successfully." });
        } else {
            await createAssignment(payload);
            toast({ title: "Assignment Created!", description: "The new assignment has been saved successfully." });
        }
      
        router.push("/teacher/assignments");

    } catch (error: any) {
       console.error("Failed to save assignment:", error);
       toast({ title: "Save Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  return (
    <>
      <PageHeader 
        title={isEditMode ? "Edit Assignment" : "Create New Assignment"} 
        description={isEditMode ? "Modify the details and questions for this assignment." : "Follow the steps to create a new quiz for your students."} 
      />
      <div className="mb-4"><Button variant="outline" onClick={() => router.push('/teacher/assignments')}><ArrowLeft className="mr-2 h-4 w-4" />Back to All Assignments</Button></div>
      
      {step === 'details' && (
        <Card><Form {...detailsForm}><form onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)}>
            <CardHeader><CardTitle>Step 1: Assignment Details</CardTitle><CardDescription>Provide a title and language for your new assignment.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <FormField control={detailsForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Assignment Title</FormLabel><FormControl><Input placeholder="e.g., Idioms Quiz 1" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={detailsForm.control} name="language" render={({ field }) => (<FormItem><FormLabel>Language</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a language" /></SelectTrigger></FormControl><SelectContent><SelectItem value="EN">English</SelectItem><SelectItem value="JP">Japanese</SelectItem><SelectItem value="KR">Korean</SelectItem><SelectItem value="VI">Vietnamese</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            </CardContent>
            <CardFooter><Button type="submit">Continue to Questions <ArrowRight className="ml-2 h-4 w-4" /></Button></CardFooter>
        </form></Form></Card>
      )}

      {step === 'questions' && (
         <div className="space-y-6">
             <Card>
                <Form {...generationForm}>
                    <form onSubmit={generationForm.handleSubmit(handleGenerateQuestions)}>
                        <CardHeader><CardTitle>Step 2: Build Your Assignment</CardTitle><CardDescription>Generate questions with AI, add your own, and finalize the assignment: "{assignmentDetails?.title}".</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={generationForm.control} name="topic" render={({ field }) => (<FormItem><FormLabel>Question Topic</FormLabel><FormControl><Input placeholder="e.g., Common English Idioms" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField control={generationForm.control} name="difficulty" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Difficulty</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
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
                                )}/>
                                <FormField control={generationForm.control} name="questionType" render={({ field }) => (<FormItem><FormLabel>Question Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="multiple-choice">Multiple Choice</SelectItem><SelectItem value="true-false">True/False</SelectItem><SelectItem value="fill-in-the-blank">Fill-in-the-Blank</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                                <FormField control={generationForm.control} name="numberOfQuestions" render={({ field }) => (<FormItem><FormLabel>Number to Generate</FormLabel><FormControl><Input type="number" min="1" max="10" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                        </CardContent>
                        <CardFooter><Button type="submit" disabled={isGenerating} className="bg-accent hover:bg-accent/90">{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}{isGenerating ? "Generating..." : "Generate Questions"}</Button></CardFooter>
                    </form>
                </Form>
            </Card>
            
            <Separator />

            <div className="space-y-6">
                 <div>
                    <h3 className="font-semibold mb-2">Available Questions</h3>
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                        <div className="p-4 border rounded-md min-h-full space-y-3">
                            <h4 className="font-medium text-center mb-2">AI-Generated</h4>
                            {isGenerating && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                            {!isGenerating && availableAiQuestions.length === 0 && (<div className="text-center text-muted-foreground pt-12"><Wand2 className="mx-auto h-8 w-8 mb-2" /><p>Generated questions will appear here.</p></div>)}
                            {availableAiQuestions.map((q, index) => (<QuestionCard key={q.id || index} q={q} index={index} onAction={handleAddQuestionToSelection} actionType="add" />))}
                        </div>
                        <div>
                           <ManualQuestionForm onAddQuestion={handleAddManualQuestion} />
                        </div>
                    </div>
                </div>
                 <Form {...selectionForm}>
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Selected Questions for Assignment ({fields.length})</CardTitle>
                        </CardHeader>
                        <div className="flex flex-col flex-1 min-h-0">
                            <form onSubmit={selectionForm.handleSubmit(handleSaveAssignment)} className="flex flex-col flex-1">
                                <CardContent className="space-y-3 flex-1 min-h-0 overflow-y-auto">
                                    {fields.length === 0 ? (
                                        <div className="text-center text-muted-foreground pt-12">
                                            <BookCheck className="mx-auto h-8 w-8 mb-2" />
                                            <p>Your chosen questions will appear here.</p>
                                        </div>
                                    ) : (
                                        fields.map((field, index) => (
                                            <QuestionCard 
                                                key={field.id} 
                                                q={field as QuizQuestion} 
                                                index={index} 
                                                onAction={handleRemoveQuestionFromSelection} 
                                                actionType="remove" 
                                            />
                                        ))
                                    )}
                                </CardContent>
                                <CardFooter className="justify-between mt-auto">
                                    <Button type="button" variant="outline" onClick={handleBackToDetails} disabled={isSaving || isEditMode}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
                                    </Button>
                                    <Button type="submit" disabled={isSaving || fields.length === 0}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        {isSaving ? "Saving..." : `${isEditMode ? "Update" : "Save"} Assignment (${fields.length} questions)`}
                                    </Button>
                                </CardFooter>
                            </form>
                        </div>
                    </Card>
                 </Form>
            </div>
         </div>
      )}
    </>
  );
}
