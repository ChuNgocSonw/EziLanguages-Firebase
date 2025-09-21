
"use client";

import { useState } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { lessonsData } from "@/lib/lessons";
import { Mic, Headphones, BookOpen, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateLessonForm from "@/components/create-lesson-form";

export default function ContentManagementPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Content Management"
        description="View all static lesson content currently available in the application."
      />
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Lesson Library</CardTitle>
            <CardDescription>
              This content is currently stored in the codebase.
            </CardDescription>
          </div>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
               <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create a New Lesson</DialogTitle>
                <DialogDescription>
                  Fill out the form to add a new lesson with reading and listening activities. 
                  (Note: In this demo, this will modify a placeholder lesson.)
                </DialogDescription>
              </DialogHeader>
              <CreateLessonForm onFinished={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {lessonsData.map((lesson) => (
              <AccordionItem value={lesson.id} key={lesson.id}>
                <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="text-lg font-semibold">{lesson.unit}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pl-4 border-l-2 border-primary/20 ml-4">
                    {/* Reading Sentences */}
                    {lesson.activities.reading && lesson.activities.reading.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 font-semibold mb-2 text-md">
                            <Mic className="h-5 w-5 text-muted-foreground" />
                            Reading Sentences ({lesson.activities.reading.length})
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                          {lesson.activities.reading.map((sentence, index) => (
                            <li key={`reading-${lesson.id}-${index}`}>{sentence.text}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Listening Exercises */}
                    {lesson.activities.listening && lesson.activities.listening.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 font-semibold mb-2 text-md">
                            <Headphones className="h-5 w-5 text-muted-foreground" />
                            Listening Exercises ({lesson.activities.listening.length})
                        </h4>
                         <ul className="list-disc pl-5 space-y-3 text-muted-foreground">
                           {lesson.activities.listening.map((exercise, index) => (
                            <li key={`listening-${lesson.id}-${index}`}>
                                <p><span className="font-semibold text-foreground/80">Text:</span> {exercise.text}</p>
                                <p><span className="font-semibold text-foreground/80">Type:</span> {exercise.type}</p>
                                {exercise.type === 'mcq' && (
                                    <>
                                        <p><span className="font-semibold text-foreground/80">Options:</span> {exercise.options.join(", ")}</p>
                                        <p><span className="font-semibold text-foreground/80">Answer:</span> {exercise.answer}</p>
                                    </>
                                )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
