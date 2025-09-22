
"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mic, Headphones, BookOpen, PlusCircle, Trash2, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CreateLessonForm from "@/components/create-lesson-form";
import { useAuth } from "@/hooks/use-auth";
import type { Lesson } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function ContentManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { getLessons, deleteLesson } = useAuth();
  const { toast } = useToast();

  const fetchLessons = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedLessons = await getLessons();
      setLessons(fetchedLessons);
    } catch (error) {
      console.error("Failed to fetch lessons:", error);
      toast({ title: "Error", description: "Could not fetch lessons.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [getLessons, toast]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const onLessonSaved = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingLesson(null);
    fetchLessons(); // Refresh the list
  };
  
  const handleEditClick = (lesson: Lesson) => {
    setEditingLesson({ ...lesson });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (lessonId: string) => {
    setIsDeleting(lessonId);
    try {
      await deleteLesson(lessonId);
      toast({ title: "Success", description: "Lesson deleted successfully." });
      setLessons(prev => prev.filter(l => l.id !== lessonId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Content Management"
        description="Create, view, and manage all lesson content in the application."
      />
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Lesson Library</CardTitle>
            <CardDescription>
              This content is stored in the database.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                    </DialogDescription>
                </DialogHeader>
                <CreateLessonForm onFinished={onLessonSaved} />
                </DialogContent>
            </Dialog>
           </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : lessons.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {lessons.map((lesson) => (
                <AccordionItem value={lesson.id} key={lesson.id}>
                  <div className="flex items-center justify-between w-full">
                    <AccordionTrigger className="flex-1 hover:no-underline">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <span className="text-lg font-semibold text-left">{lesson.unit}</span>
                        </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(lesson)} className="hover:bg-muted">
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0 hover:bg-destructive/10">
                                {isDeleting === lesson.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive" />}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the lesson "{lesson.unit}".
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(lesson.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
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
                                  {exercise.type === 'mcq' && exercise.options && (
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
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold">No Lessons Found</h3>
              <p className="text-muted-foreground mt-2">Click "Create New Lesson" to add the first one.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>
              You are currently editing the lesson: "{editingLesson?.unit}"
            </DialogDescription>
          </DialogHeader>
          <CreateLessonForm 
            key={editingLesson?.id}
            onFinished={onLessonSaved} 
            existingLesson={editingLesson} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
