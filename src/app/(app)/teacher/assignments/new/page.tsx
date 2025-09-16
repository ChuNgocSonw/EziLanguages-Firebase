
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { generateQuizQuestions } from "@/lib/actions";

const assignmentSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters."),
  title: z.string().min(3, "Title must be at least 3 characters."),
  language: z.enum(["EN", "JP", "KR", "VI"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  numberOfQuestions: z.coerce.number().min(1, "Must have at least 1 question.").max(30, "Cannot exceed 30 questions."),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export default function NewAssignmentPage() {
  const router = useRouter();
  const { createAssignment } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      topic: "",
      title: "",
      language: "EN",
      difficulty: "Medium",
      numberOfQuestions: 5,
    },
  });

  const onSubmit = async (data: AssignmentFormData) => {
    setIsLoading(true);
    try {
      // Step 1: Generate questions using AI
      toast({ title: "Generating Questions...", description: "Please wait while the AI creates the quiz questions." });
      const questions = await generateQuizQuestions({
        topic: data.topic,
        difficulty: data.difficulty,
        numberOfQuestions: data.numberOfQuestions,
      });

      if (!questions || questions.length === 0) {
        throw new Error("The AI failed to generate questions for this topic.");
      }

      // Step 2: Save the assignment with the generated questions
      toast({ title: "Saving Assignment...", description: "The questions have been generated, saving the assignment." });
      await createAssignment({
        title: data.title,
        language: data.language,
        questions: questions,
      });

      toast({
        title: "Assignment Created!",
        description: "The new assignment has been saved successfully.",
      });
      router.push("/teacher/assignments");

    } catch (error: any) {
      console.error("Failed to create assignment:", error);
      toast({
        title: "Creation Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>
                The AI will generate multiple-choice questions based on the topic and difficulty you provide.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Common English Idioms, French Past Tense" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Idioms Quiz 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
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
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Difficulty</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex items-center space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Easy" />
                            </FormControl>
                            <FormLabel className="font-normal">Easy</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Medium" />
                            </FormControl>
                            <FormLabel className="font-normal">Medium</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Hard" />
                            </FormControl>
                            <FormLabel className="font-normal">Hard</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfQuestions"
                  render={({ field }) => (
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
              <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Generating & Saving..." : "Create Assignment"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
