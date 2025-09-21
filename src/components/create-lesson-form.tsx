
"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import type { Lesson } from "@/lib/types";

const readingSchema = z.object({
  text: z.string().min(10, "Sentence must be at least 10 characters long."),
});

const listeningSchema = z.object({
  id: z.string(),
  type: z.enum(['typing', 'mcq']),
  text: z.string().min(10, "The sentence to be heard is required."),
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

const lessonSchema = z.object({
  unit: z.string().min(3, "Unit name is required."),
  reading: z.array(readingSchema),
  listening: z.array(listeningSchema),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface CreateLessonFormProps {
    onFinished: () => void;
}

export default function CreateLessonForm({ onFinished }: CreateLessonFormProps) {
    const { toast } = useToast();
    const { createLesson } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<LessonFormData>({
        resolver: zodResolver(lessonSchema),
        defaultValues: {
            unit: "",
            reading: [],
            listening: [],
        },
    });

    const { fields: readingFields, append: appendReading, remove: removeReading } = useFieldArray({
        control: form.control,
        name: "reading",
    });

    const { fields: listeningFields, append: appendListening, remove: removeListening } = useFieldArray({
        control: form.control,
        name: "listening",
    });

    const onSubmit = async (data: LessonFormData) => {
        setIsSaving(true);
        try {
            const lessonPayload = {
                unit: data.unit,
                activities: {
                    reading: data.reading.map(r => ({ ...r, unit: data.unit })),
                    listening: data.listening.map(l => ({ ...l, answer: l.type === 'typing' ? l.text : l.answer })),
                },
                content: [...data.reading, ...data.listening].map(item => `- ${item.text}`).join('\n'),
            };

            await createLesson(lessonPayload as Omit<Lesson, 'id'|'createdAt'|'teacherId'>);

            toast({
                title: "Tạo bài học thành công",
                description: "Bài học mới đã được tạo thành công.",
            });
            onFinished();
        } catch (error: any) {
            console.error("Failed to save lesson:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save the lesson.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const watchListeningType = useWatch({ control: form.control, name: 'listening' });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <ScrollArea className="h-[60vh]">
                    <div className="p-1 pr-4 space-y-6">
                        <FormField
                            control={form.control}
                            name="unit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold">Lesson Title / Unit</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Unit 11: Advanced Adjectives" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator />
                        
                        {/* Reading Sentences Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Reading Sentences</CardTitle>
                                <CardDescription>Add sentences for students to practice reading and pronunciation.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {readingFields.map((field, index) => (
                                    <div key={field.id} className="flex items-start gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`reading.${index}.text`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                     <FormControl>
                                                        <Input {...field} placeholder={`Sentence ${index + 1}`} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeReading(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                 <Button type="button" variant="outline" onClick={() => appendReading({ text: "" })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Sentence
                                </Button>
                            </CardContent>
                        </Card>
                        
                         <Separator />

                        {/* Listening Exercises Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Listening Exercises</CardTitle>
                                <CardDescription>Add listening comprehension exercises.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {listeningFields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeListening(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                        <h4 className="font-medium">Exercise {index + 1}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={form.control} name={`listening.${index}.type`} render={({ field }) => (
                                                <FormItem><FormLabel>Exercise Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="typing">Type what you hear</SelectItem><SelectItem value="mcq">Multiple Choice</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name={`listening.${index}.text`} render={({ field }) => (
                                                <FormItem><FormLabel>Sentence to be heard</FormLabel><FormControl><Input placeholder="This text will be converted to audio." {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        {watchListeningType && watchListeningType[index]?.type === 'mcq' && (
                                            <div className="space-y-2">
                                                <FormLabel>Multiple Choice Options</FormLabel>
                                                {[0, 1, 2].map(i => (
                                                    <FormField key={`${field.id}-opt-${i}`} control={form.control} name={`listening.${index}.options.${i}`} render={({ field }) => (
                                                        <FormItem><FormControl><Input placeholder={`Option ${i + 1}`} {...field} /></FormControl><FormMessage /></FormItem>
                                                    )}/>
                                                ))}
                                                 <FormField control={form.control} name={`listening.${index}.answer`} render={({ field }) => (
                                                    <FormItem><FormLabel>Correct Answer</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value}>{watchListeningType[index]?.options?.map((opt, i) => opt?.trim() && (<FormItem key={`${field.id}-ans-${i}`} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={opt} /></FormControl><FormLabel className="font-normal">{opt}</FormLabel></FormItem>))}</RadioGroup></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => appendListening({ id: `new-${Date.now()}`, type: 'typing', text: '', options: ["", "", ""], answer: "" })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Exercise
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
                <div className="flex justify-end p-4 border-t">
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Lesson
                    </Button>
                </div>
            </form>
        </Form>
    );
}
