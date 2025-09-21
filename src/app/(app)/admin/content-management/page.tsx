
"use client";

import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { lessonsData } from "@/lib/lessons";
import { Mic, Headphones, BookOpen } from "lucide-react";

export default function ContentManagementPage() {
  return (
    <>
      <PageHeader
        title="Content Management"
        description="View all static lesson content currently available in the application."
      />
      <Card>
        <CardHeader>
          <CardTitle>Lesson Library</CardTitle>
          <CardDescription>
            This content is currently stored in the codebase. Future updates will allow for management via this interface.
          </CardDescription>
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
