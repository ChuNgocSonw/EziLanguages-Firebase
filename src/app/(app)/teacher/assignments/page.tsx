
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, BookCopy, Languages, ListChecks, Trash2 } from "lucide-react";
import type { Assignment } from "@/lib/types";
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

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { getTeacherAssignments, deleteAssignment } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      try {
        const teacherAssignments = await getTeacherAssignments();
        setAssignments(teacherAssignments);
      } catch (error: any) {
        console.error("Failed to fetch assignments:", error);
        toast({ 
            title: "Error", 
            description: `Failed to fetch assignments. ${error.message}`, 
            variant: "destructive" 
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, [getTeacherAssignments, toast]);

  const handleDeleteAssignment = async (assignmentId: string) => {
    setIsDeleting(assignmentId);
    try {
      await deleteAssignment(assignmentId);
      toast({ title: "Success", description: "Assignment deleted successfully." });
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete assignment.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };


  return (
    <>
      <PageHeader
        title="Your Assignments"
        description="Create, view, and manage quizzes for your classes."
      />
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Assignment List</CardTitle>
            <CardDescription>All the assignments you have created.</CardDescription>
          </div>
          <Button className="bg-accent hover:bg-accent/90" asChild>
            <Link href="/teacher/assignments/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Assignment
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : assignments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookCopy className="h-5 w-5 text-primary" />
                        {assignment.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Languages className="h-4 w-4" />
                        <span>Language: {assignment.language}</span>
                    </div>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ListChecks className="h-4 w-4" />
                        <span>{assignment.questions.length} questions</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" className="w-full" disabled>Assign</Button>
                    <Button variant="secondary" className="w-full" disabled>Edit</Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" disabled={isDeleting === assignment.id} className="shrink-0 hover:bg-destructive/10">
                           {isDeleting === assignment.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the assignment "{assignment.title}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold">No Assignments Yet</h3>
              <p className="text-muted-foreground mt-2">
                Click "Create New Assignment" to build your first quiz.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
