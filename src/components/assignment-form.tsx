

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
import { Loader2, ArrowLeft, Wand2, Save, ArrowRight, PlusCircle, Trash2, BookCheck, Mic, Headphones } from "lucide-react";
import { generateQuizQuestions, generateReadingSentences, generateListeningExercises } from "@/lib/actions";
import { QuizQuestion, QuizQuestionSchema, QuestionType, Assignment, AssignmentType, ReadingSentence, ListeningExercise } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useScroll } from "@/app/(app)/layout";


const detailsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  language: z.enum(["EN"]).default("EN"),
  assignmentType: z.enum(['quiz', 'reading', 'listening']),
});
type DetailsFormData = z.infer<typeof detailsSchema>;

const questionsSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});
type QuestionsFormData = z.infer<typeof questionsSchema>;

const readingSentencesSchema = z.object({
    sentences: z.array(z.object({ unit: z.string(), text: z.string() })),
});
type ReadingSentencesFormData = z.infer<typeof readingSentencesSchema>;

const listeningExercisesSchema = z.object({
    exercises: z.array(z.object({ id: z.string(), type: z.enum(['typing', 'mcq']), text: z.string(), options: z.array(z.string()).optional(), answer: z.string().optional() })),
});
type ListeningExercisesFormData = z.infer<typeof listeningExercisesSchema>;


const generationSchema = z.object({
    topic: z.string().min(3, "Topic must be at least 3 characters."),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    numberOfQuestions: z.coerce.number().min(1, "Must have at least 1 question.").max(10, "Cannot exceed 10 questions per generation."),
    questionType: z.enum(['multiple-choice', 'true-false', 'fill-in-the-blank']),
});
type GenerationFormData = z.infer<typeof generationSchema>;

const readingGenerationSchema = z.object({
    topic: z.string().min(3, "Topic must be at least 3 characters."),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    numberOfSentences: z.coerce.number().min(1, "Must be at least 1 sentence.").max(10, "Cannot exceed 10 sentences."),
});
type ReadingGenerationFormData = z.infer<typeof readingGenerationSchema>;

const listeningGenerationSchema = z.object({
    topic: z.string().min(3, "Topic must be at least 3 characters."),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    numberOfExercises: z.coerce.number().min(1, "Must be at least 1 exercise.").max(10, "Cannot exceed 10 exercises."),
});
type ListeningGenerationFormData = z.infer<typeof listeningGenerationSchema>;


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

const manualReadingSchema = z.object({
    unit: z.string().min(3, "Unit/Topic name is required."),
    text: z.string().min(10, "Sentence must be at least 10 characters long."),
});
type ManualReadingFormData = z.infer<typeof manualReadingSchema>;

const manualListeningSchema = z.object({
    type: z.enum(['typing', 'mcq']),
    text: z.string().min(10, "The sentence to be heard is required."),
    // Fields for MCQ type
    options: z.array(z.string()).optional(),
    answer: z.string().optional(),
}).refine(data => {
    if (data.type === 'mcq') {
        return data.options && data.options.length === 3 && data.options.every(opt => opt.trim() !== "") && data.answer && data.options.includes(data.answer);
    }
    return true;
}, {
    message: "For Multiple Choice, all 3 options are required and the correct answer must be one of them.",
    path: ['answer'],
});
type ManualListeningFormData = z.infer<typeof manualListeningSchema>;



interface AssignmentFormProps {
    existingAssignment?: Assignment;
}

export default function AssignmentForm({ existingAssignment }: AssignmentFormProps) {
  const router = useRouter();
  const { createAssignment, updateAssignment } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useScroll();

  const isEditMode = !!existingAssignment;
  
  const [step, setStep] = useState<"details" | "content">("details");
  const [assignmentDetails, setAssignmentDetails] = useState<DetailsFormData | null>(
      isEditMode ? { 
          title: existingAssignment.title, 
          language: existingAssignment.language,
          assignmentType: existingAssignment.assignmentType || 'quiz'
      } : null
  );

  const [isSaving, setIsSaving] = useState(false);
  
  // Content States
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableAiQuestions, setAvailableAiQuestions] = useState<QuizQuestion[]>([]);
  const [availableAiSentences, setAvailableAiSentences] = useState<ReadingSentence[]>([]);
  const [availableAiExercises, setAvailableAiExercises] = useState<ListeningExercise[]>([]);
  
  const detailsForm = useForm<DetailsFormData>({ 
      resolver: zodResolver(detailsSchema), 
      defaultValues: { 
          title: existingAssignment?.title || "", 
          language: "EN",
          assignmentType: existingAssignment?.assignmentType || 'quiz',
      } 
  });
  
  const generationForm = useForm<GenerationFormData>({ 
      resolver: zodResolver(generationSchema), 
      defaultValues: { topic: "", difficulty: "Medium", numberOfQuestions: 5, questionType: 'multiple-choice' }
  });

  const readingGenerationForm = useForm<ReadingGenerationFormData>({ 
      resolver: zodResolver(readingGenerationSchema), 
      defaultValues: { topic: "", difficulty: "Medium", numberOfSentences: 5 }
  });

   const listeningGenerationForm = useForm<ListeningGenerationFormData>({ 
      resolver: zodResolver(listeningGenerationSchema), 
      defaultValues: { topic: "", difficulty: "Medium", numberOfExercises: 5 }
  });

  const contentForm = useForm({
      defaultValues: {
          questions: existingAssignment?.questions || [],
          readingSentences: existingAssignment?.readingSentences || [],
          listeningExercises: existingAssignment?.listeningExercises || [],
      }
  });

  const { fields: quizFields, append: appendQuiz, remove: removeQuiz } = useFieldArray({ control: contentForm.control, name: "questions" });
  const { fields: readingFields, append: appendReading, remove: removeReading } = useFieldArray({ control: contentForm.control, name: "readingSentences" });
  const { fields: listeningFields, append: appendListening, remove: removeListening } = useFieldArray({ control: contentForm.control, name: "listeningExercises" });

  useEffect(() => {
    if (isEditMode) {
        setStep("content");
    }
  }, [isEditMode]);

  const handleDetailsSubmit = (data: DetailsFormData) => { setAssignmentDetails(data); setStep("content"); };
  const handleBackToDetails = () => { setStep('details'); };

  const withScrollPreservation = (fn: (...args: any[]) => void) => {
    return (...args: any[]) => {
      if (!scrollAreaRef?.current) {
        fn(...args);
        return;
      }
      const scrollPosition = scrollAreaRef.current.scrollTop;
      fn(...args);
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollPosition;
        }
      });
    };
  };

  const handleGenerateQuestions = async (data: GenerationFormData) => {
    setIsGenerating(true);
    setAvailableAiQuestions([]);
    try {
      toast({ title: "Generating Questions...", description: "Please wait while the AI creates the quiz questions." });
      const generated = await generateQuizQuestions(data);
      if (!generated || generated.length === 0) throw new Error("The AI failed to generate questions for this topic.");
      
      const questionsWithIds = generated.map(q => ({ ...q, id: `ai-${new Date().getTime()}-${Math.random()}`}));
      setAvailableAiQuestions(questionsWithIds);

    } catch (error: any) {
      console.error("Failed to generate questions:", error);
      toast({ title: "Generation Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const handleGenerateSentences = async (data: ReadingGenerationFormData) => {
    setIsGenerating(true);
    setAvailableAiSentences([]);
    try {
      toast({ title: "Generating Sentences...", description: "Please wait while the AI creates the reading sentences." });
      const generated = await generateReadingSentences(data);
      if (!generated || generated.length === 0) throw new Error("The AI failed to generate sentences for this topic.");
      setAvailableAiSentences(generated);
    } catch (error: any) {
      console.error("Failed to generate sentences:", error);
      toast({ title: "Generation Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const handleGenerateExercises = async (data: ListeningGenerationFormData) => {
    setIsGenerating(true);
    setAvailableAiExercises([]);
    try {
      toast({ title: "Generating Exercises...", description: "Please wait while the AI creates the listening exercises." });
      const generated = await generateListeningExercises(data);
      if (!generated || generated.length === 0) throw new Error("The AI failed to generate exercises for this topic.");
      setAvailableAiExercises(generated);
    } catch (error: any) {
      console.error("Failed to generate exercises:", error);
      toast({ title: "Generation Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally { setIsGenerating(false); }
  };
  
  const handleAddQuestionToSelection = withScrollPreservation((index: number) => {
    const question = availableAiQuestions[index];
    appendQuiz(question);
    setAvailableAiQuestions(prev => prev.filter((_, i) => i !== index));
  });
  
  const handleRemoveQuestionFromSelection = withScrollPreservation((index: number) => {
    const removedQuestion = quizFields[index] as any;
    removeQuiz(index);
    if (removedQuestion.id && removedQuestion.id.startsWith('ai-')) {
        setAvailableAiQuestions(prev => [...prev, removedQuestion]);
    }
  });

  const handleAddSentenceToSelection = withScrollPreservation((index: number) => {
    const sentence = availableAiSentences[index];
    appendReading(sentence);
    setAvailableAiSentences(prev => prev.filter((_, i) => i !== index));
  });
  
  const handleRemoveSentenceFromSelection = withScrollPreservation((index: number) => {
    const removedSentence = readingFields[index] as any;
    removeReading(index);
    if (availableAiSentences.every(s => s.text !== removedSentence.text)) {
      setAvailableAiSentences(prev => [...prev, removedSentence]);
    }
  });

  const handleAddExerciseToSelection = withScrollPreservation((index: number) => {
    const exercise = availableAiExercises[index];
    appendListening(exercise);
    setAvailableAiExercises(prev => prev.filter((_, i) => i !== index));
  });

  const handleRemoveExerciseFromSelection = withScrollPreservation((index: number) => {
    const removedExercise = listeningFields[index] as any;
    removeListening(index);
    setAvailableAiExercises(prev => [...prev, removedExercise]);
  });


  const handleAddManualQuestion = withScrollPreservation((question: QuizQuestion) => {
    if (quizFields.some(q => q.question === question.question)) {
        toast({ title: "Duplicate Question", description: "This question is already in your selected list.", variant: "destructive" });
        return;
    }
    appendQuiz(question);
    toast({ title: "Question Added", description: "Your manual question has been added to the list." });
  });
  
  const handleAddManualReading = withScrollPreservation((sentence: ReadingSentence) => {
    appendReading(sentence);
    toast({ title: "Sentence Added" });
  });

  const handleAddManualListening = withScrollPreservation((exercise: ListeningExercise) => {
      appendListening({
        ...exercise,
        id: `manual-${new Date().getTime()}`, // Assign a temporary unique ID
        answer: exercise.type === 'typing' ? exercise.text : exercise.answer,
      });
      toast({ title: "Exercise Added" });
  });


  const handleSaveAssignment = async (data: any) => {
    if (!assignmentDetails) return;
    
    const { questions, readingSentences, listeningExercises } = data;
    const { assignmentType } = assignmentDetails;
    
    let hasContent = false;
    if (assignmentType === 'quiz' && questions.length > 0) hasContent = true;
    if (assignmentType === 'reading' && readingSentences.length > 0) hasContent = true;
    if (assignmentType === 'listening' && listeningExercises.length > 0) hasContent = true;

    if (!hasContent) {
      toast({ title: "No Content", description: "Please add at least one item to the assignment.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
        const payload: Omit<Assignment, 'id' | 'teacherId' | 'createdAt'> = { 
            title: assignmentDetails.title, 
            language: "EN",
            assignmentType: assignmentType,
            questions: assignmentType === 'quiz' ? questions : [],
            readingSentences: assignmentType === 'reading' ? readingSentences : [],
            listeningExercises: assignmentType === 'listening' ? listeningExercises : [],
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
  
  // --- SUB-COMPONENTS FOR CONTENT CREATION ---

  const QuizBuilder = () => (
    <>
        <Card>
            <Form {...generationForm}>
                <form>
                    <CardHeader><CardTitle>Generate with AI</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={generationForm.control} name="topic" render={({ field }) => (<FormItem><FormLabel>Question Topic</FormLabel><FormControl><Input placeholder="e.g., Common English Idioms" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField control={generationForm.control} name="difficulty" render={({ field }) => (<FormItem><FormLabel>Difficulty</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Easy" /></FormControl><FormLabel className="font-normal">Easy</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Medium" /></FormControl><FormLabel className="font-normal">Medium</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Hard" /></FormControl><FormLabel className="font-normal">Hard</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={generationForm.control} name="questionType" render={({ field }) => (<FormItem><FormLabel>Question Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="multiple-choice">Multiple Choice</SelectItem><SelectItem value="true-false">True/False</SelectItem><SelectItem value="fill-in-the-blank">Fill-in-the-Blank</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                            <FormField control={generationForm.control} name="numberOfQuestions" render={({ field }) => (<FormItem><FormLabel>Number to Generate</FormLabel><FormControl><Input type="number" min="1" max="10" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                    </CardContent>
                    <CardFooter><Button type="button" onClick={generationForm.handleSubmit(handleGenerateQuestions)} disabled={isGenerating} className="bg-accent hover:bg-accent/90">{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}{isGenerating ? "Generating..." : "Generate Questions"}</Button></CardFooter>
                </form>
            </Form>
        </Card>
        <div className="grid md:grid-cols-2 gap-6 items-start mt-6">
            <div className="p-4 border rounded-md space-y-3">
                <h4 className="font-medium text-center mb-2">Available AI-Generated Questions</h4>
                {isGenerating && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                {!isGenerating && availableAiQuestions.length === 0 && (<div className="text-center text-muted-foreground pt-12"><Wand2 className="mx-auto h-8 w-8 mb-2" /><p>Generated questions will appear here.</p></div>)}
                {availableAiQuestions.map((q, index) => (
                    <div key={q.id || index} className="p-3 border rounded-md bg-muted/30 relative">
                        <p className="font-medium pr-8">{q.question}</p>
                        {q.options && q.options.length > 0 && (
                            <ul className="mt-2 space-y-1 text-sm list-none ml-4">
                                {q.options.map((opt, i) => (
                                    <li key={i} className={cn(
                                        "pl-2",
                                        opt.includes(q.answer) ? "font-semibold text-green-700" : ""
                                    )}>
                                       {String.fromCharCode(65 + i)}) {opt}
                                    </li>
                                ))}
                            </ul>
                        )}
                         {q.type !== 'multiple-choice' && <p className="text-sm font-semibold text-green-700 mt-1">Answer: {q.answer}</p>}
                        <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 text-green-600 hover:bg-[#2E7D32] hover:text-white" onClick={() => handleAddQuestionToSelection(index)}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                ))}
            </div>
            <ManualQuestionForm onAddQuestion={handleAddManualQuestion} />
        </div>
    </>
  );

  const ReadingBuilder = () => {
    const form = useForm<ManualReadingFormData>({ resolver: zodResolver(manualReadingSchema), defaultValues: { unit: "", text: "" } });
    const handleAdd = (data: ManualReadingFormData) => { handleAddManualReading(data); form.reset(); };
    return (<>
        <Card>
            <Form {...readingGenerationForm}>
                <form>
                    <CardHeader><CardTitle>Generate with AI</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={readingGenerationForm.control} name="topic" render={({ field }) => (<FormItem><FormLabel>Sentence Topic</FormLabel><FormControl><Input placeholder="e.g., Ordering food at a restaurant" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={readingGenerationForm.control} name="difficulty" render={({ field }) => (<FormItem><FormLabel>Difficulty</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Easy" /></FormControl><FormLabel className="font-normal">Easy</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Medium" /></FormControl><FormLabel className="font-normal">Medium</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Hard" /></FormControl><FormLabel className="font-normal">Hard</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={readingGenerationForm.control} name="numberOfSentences" render={({ field }) => (<FormItem><FormLabel>Number to Generate</FormLabel><FormControl><Input type="number" min="1" max="10" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                    </CardContent>
                    <CardFooter><Button type="button" onClick={readingGenerationForm.handleSubmit(handleGenerateSentences)} disabled={isGenerating} className="bg-accent hover:bg-accent/90">{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}{isGenerating ? "Generating..." : "Generate Sentences"}</Button></CardFooter>
                </form>
            </Form>
        </Card>
        <div className="grid md:grid-cols-2 gap-6 items-start mt-6">
             <div className="p-4 border rounded-md space-y-3">
                <h4 className="font-medium text-center mb-2">Available AI-Generated Sentences</h4>
                {isGenerating && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                {!isGenerating && availableAiSentences.length === 0 && (<div className="text-center text-muted-foreground pt-12"><Wand2 className="mx-auto h-8 w-8 mb-2" /><p>Generated sentences will appear here.</p></div>)}
                {availableAiSentences.map((s, index) => (
                    <div key={index} className="p-3 border rounded-md bg-muted/30 relative">
                        <p className="font-medium pr-8">{s.text}</p>
                        <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 text-green-600 hover:bg-[#2E7D32] hover:text-white" onClick={() => handleAddSentenceToSelection(index)}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                ))}
            </div>
            <Card><CardHeader><CardTitle>Add Reading Sentence Manually</CardTitle><CardDescription>Add sentences one by one for the reading assignment.</CardDescription></CardHeader><Form {...form}><form><CardContent className="space-y-4"><FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unit / Topic</FormLabel><FormControl><Input placeholder="e.g., Unit 1: Greetings" {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="text" render={({ field }) => (<FormItem><FormLabel>Sentence</FormLabel><FormControl><Textarea placeholder="Enter the sentence students will read." {...field} /></FormControl><FormMessage /></FormItem>)} /></CardContent><CardFooter><Button type="button" onClick={form.handleSubmit(handleAdd)}><PlusCircle className="mr-2 h-4 w-4" /> Add Sentence</Button></CardFooter></form></Form></Card>
        </div>
    </>);
  };

  const ListeningBuilder = () => {
    const manualForm = useForm<ManualListeningFormData>({ resolver: zodResolver(manualListeningSchema), defaultValues: { type: 'typing', text: "", options: ["", "", ""], answer: "" } });
    const type = useWatch({ control: manualForm.control, name: 'type' });
    const options = useWatch({ control: manualForm.control, name: 'options' });
    const handleAdd = (data: ManualListeningFormData) => { handleAddManualListening(data as ListeningExercise); manualForm.reset(); };
    
    return (<>
        <Card>
            <Form {...listeningGenerationForm}>
                <form>
                    <CardHeader><CardTitle>Generate with AI</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={listeningGenerationForm.control} name="topic" render={({ field }) => (<FormItem><FormLabel>Exercise Topic</FormLabel><FormControl><Input placeholder="e.g., Talking about the weather" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={listeningGenerationForm.control} name="difficulty" render={({ field }) => (<FormItem><FormLabel>Difficulty</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Easy" /></FormControl><FormLabel className="font-normal">Easy</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Medium" /></FormControl><FormLabel className="font-normal">Medium</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Hard" /></FormControl><FormLabel className="font-normal">Hard</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={listeningGenerationForm.control} name="numberOfExercises" render={({ field }) => (<FormItem><FormLabel>Number to Generate</FormLabel><FormControl><Input type="number" min="1" max="10" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                    </CardContent>
                    <CardFooter><Button type="button" onClick={listeningGenerationForm.handleSubmit(handleGenerateExercises)} disabled={isGenerating} className="bg-accent hover:bg-accent/90">{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}{isGenerating ? "Generating..." : "Generate Exercises"}</Button></CardFooter>
                </form>
            </Form>
        </Card>
        <div className="grid md:grid-cols-2 gap-6 items-start mt-6">
            <div className="p-4 border rounded-md space-y-3">
                <h4 className="font-medium text-center mb-2">Available AI-Generated Exercises</h4>
                {isGenerating && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                {!isGenerating && availableAiExercises.length === 0 && (<div className="text-center text-muted-foreground pt-12"><Wand2 className="mx-auto h-8 w-8 mb-2" /><p>Generated exercises will appear here.</p></div>)}
                {availableAiExercises.map((ex, index) => (
                    <div key={ex.id || index} className="p-3 border rounded-md bg-muted/30 relative">
                        <p className="font-medium pr-8">{ex.text}</p>
                        <p className="text-sm text-muted-foreground">Type: {ex.type}</p>
                        <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 text-green-600 hover:bg-[#2E7D32] hover:text-white" onClick={() => handleAddExerciseToSelection(index)}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                ))}
            </div>
            <Card><CardHeader><CardTitle>Add Listening Exercise Manually</CardTitle></CardHeader><Form {...manualForm}><form><CardContent className="space-y-4"><FormField control={manualForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>Exercise Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="typing">Type what you hear</SelectItem><SelectItem value="mcq">Multiple Choice</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} /><FormField control={manualForm.control} name="text" render={({ field }) => (<FormItem><FormLabel>Sentence to be heard</FormLabel><FormControl><Textarea placeholder="This is the text that will be converted to audio." {...field} /></FormControl><FormMessage /></FormItem>)} />{type === 'mcq' && (<><FormLabel>Options (Provide 3 choices)</FormLabel>{[0, 1, 2].map(i => (<FormField key={i} control={manualForm.control} name={`options.${i}`} render={({ field }) => (<FormItem><FormControl><Input placeholder={`Option ${i + 1}`} {...field} /></FormControl><FormMessage /></FormItem>)} />))}<FormField control={manualForm.control} name="answer" render={({ field }) => (<FormItem><FormLabel>Correct Answer</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value}>{options?.map((opt, i) => opt.trim() && (<FormItem key={i} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={opt} /></FormControl><FormLabel className="font-normal">{opt}</FormLabel></FormItem>))}</RadioGroup></FormControl><FormMessage /></FormItem>)} /></>)}</CardContent><CardFooter><Button type="button" onClick={manualForm.handleSubmit(handleAdd)}><PlusCircle className="mr-2 h-4 w-4" /> Add Exercise</Button></CardFooter></form></Form></Card>
        </div>
    </>);
  };

  const ManualQuestionForm = ({ onAddQuestion }: { onAddQuestion: (q: QuizQuestion) => void }) => {
    const form = useForm<ManualQuestionFormData>({ resolver: zodResolver(manualQuestionSchema), defaultValues: { type: 'multiple-choice', question: "", options: ["", "", "", ""], answer: "" } });
    const questionType = useWatch({ control: form.control, name: 'type' });
    const options = useWatch({ control: form.control, name: 'options' });
    const handleManualSubmit = (data: ManualQuestionFormData) => { const finalQuestion: QuizQuestion = { id: new Date().getTime().toString(), type: data.type, question: data.question, answer: data.answer, options: data.type === 'multiple-choice' ? data.options : [], }; onAddQuestion(finalQuestion); form.reset(); };
    return (
      <Card>
        <CardHeader>
            <CardTitle>Add Question Manually</CardTitle>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form className="space-y-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Question Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="true-false">True/False</SelectItem>
                                    <SelectItem value="fill-in-the-blank">Fill-in-the-Blank</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="question" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Question Text</FormLabel>
                            <FormControl><Textarea placeholder="Enter the question here..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    {questionType === 'multiple-choice' && (
                        <>
                            {[0, 1, 2, 3].map(i => (
                                <FormField key={i} control={form.control} name={`options.${i}`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Option {i + 1}</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                    </FormItem>
                                )}/>
                            ))}
                            <FormField control={form.control} name="answer" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correct Answer</FormLabel>
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
                            )} />
                        </>
                    )}
                    {questionType === 'true-false' && (
                        <FormField control={form.control} name="answer" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Correct Answer</FormLabel>
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
                        )} />
                    )}
                    {questionType === 'fill-in-the-blank' && (
                        <FormField control={form.control} name="answer" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Correct Answer</FormLabel>
                                <FormControl><Input placeholder="Enter the word(s) that fill the blank" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}
                    <Button type="button" onClick={form.handleSubmit(handleManualSubmit)} variant="secondary"><PlusCircle className="mr-2 h-4 w-4" /> Add This Question</Button>
                </form>
            </Form>
        </CardContent>
      </Card>
    );
  };


  const renderContentBuilder = () => {
      switch (assignmentDetails?.assignmentType) {
          case 'quiz': return <QuizBuilder />;
          case 'reading': return <ReadingBuilder />;
          case 'listening': return <ListeningBuilder />;
          default: return <p>Please select an assignment type.</p>;
      }
  }
  
  const renderSelectedContent = () => {
    switch (assignmentDetails?.assignmentType) {
        case 'quiz':
            return quizFields.length > 0 ? quizFields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-md bg-muted/30 relative">
                    <p className="font-medium pr-8">{field.question}</p>
                    {field.options && field.options.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm list-none ml-4">
                            {field.options.map((opt, i) => (
                                <li key={i} className={cn(
                                    "pl-2",
                                    opt.includes(field.answer) ? "font-semibold text-green-700" : ""
                                )}>
                                    {String.fromCharCode(65 + i)}) {opt}
                                </li>
                            ))}
                        </ul>
                    )}
                    {field.type !== 'multiple-choice' && <p className="text-sm font-semibold text-green-700 mt-1">Answer: {field.answer}</p>}
                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-[#D32F2F] hover:text-white" onClick={() => handleRemoveQuestionFromSelection(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )) : <EmptyContentPlaceholder icon={BookCheck} text="Your chosen questions will appear here." />;
        case 'reading':
            return readingFields.length > 0 ? readingFields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-md bg-muted/30 relative"><p className="font-medium pr-8">{`• ${field.text}`}</p><p className="text-sm text-muted-foreground">Unit: {field.unit}</p><Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-[#D32F2F] hover:text-white" onClick={() => handleRemoveSentenceFromSelection(index)}><Trash2 className="h-4 w-4" /></Button></div>
            )) : <EmptyContentPlaceholder icon={Mic} text="Your chosen reading sentences will appear here." />;
        case 'listening':
            return listeningFields.length > 0 ? listeningFields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-md bg-muted/30 relative"><p className="font-medium pr-8">{`• ${field.text}`}</p><p className="text-sm text-muted-foreground">Type: {field.type}</p><Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-[#D32F2F] hover:text-white" onClick={() => handleRemoveExerciseFromSelection(index)}><Trash2 className="h-4 w-4" /></Button></div>
            )) : <EmptyContentPlaceholder icon={Headphones} text="Your chosen listening exercises will appear here." />;
        default: return null;
    }
  };

  const EmptyContentPlaceholder = ({icon: Icon, text}: {icon: React.ElementType, text: string}) => (
      <div className="text-center text-muted-foreground pt-12"><Icon className="mx-auto h-8 w-8 mb-2" /><p>{text}</p></div>
  );


  return (
    <>
      <PageHeader 
        title={isEditMode ? "Edit Assignment" : "Create New Assignment"} 
        description={isEditMode ? "Modify the details and content for this assignment." : "Follow the steps to create a new assignment for your students."} 
      />
      <div className="mb-4"><Button variant="outline" onClick={() => router.push('/teacher/assignments')}><ArrowLeft className="mr-2 h-4 w-4" />Back to All Assignments</Button></div>
      
      {step === 'details' && (
        <Card><Form {...detailsForm}><form onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)}>
            <CardHeader><CardTitle>Step 1: Assignment Details</CardTitle><CardDescription>Provide a title and select the type for your new assignment.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <FormField control={detailsForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Assignment Title</FormLabel><FormControl><Input placeholder="e.g., Idioms Quiz 1" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField
                    control={detailsForm.control}
                    name="assignmentType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assignment Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="reading">Reading</SelectItem>
                            <SelectItem value="listening">Listening</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
            <CardFooter><Button type="submit">Continue to Content <ArrowRight className="ml-2 h-4 w-4" /></Button></CardFooter>
        </form></Form></Card>
      )}

      {step === 'content' && (
         <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Step 2: Build Your Assignment</CardTitle>
                    <CardDescription>
                        Assignment: "{assignmentDetails?.title}" ({assignmentDetails?.assignmentType})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContentBuilder()}
                </CardContent>
            </Card>
            
            <Separator />

             <Form {...contentForm}>
                <Card>
                    <CardHeader>
                        <CardTitle>Final Assignment Content</CardTitle>
                    </CardHeader>
                    <form onSubmit={contentForm.handleSubmit(handleSaveAssignment)}>
                        <CardContent className="space-y-3">
                            {renderSelectedContent()}
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Button type="button" variant="outline" onClick={handleBackToDetails} disabled={isSaving || isEditMode}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {isSaving ? "Saving..." : `${isEditMode ? "Update" : "Save"} Assignment`}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </Form>
         </div>
      )}
    </>
  );
}
