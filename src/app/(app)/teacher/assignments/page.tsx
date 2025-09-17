
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, BookCopy, Languages, ListChecks, Trash2, Pencil, Send } from "lucide-react";
import type { Assignment, Class } from "@/lib/types";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@radix-ui/react-toast";

function AssignDialog({ assignment, onAssignmentAssigned }: { assignment: Assignment; onAssignmentAssigned: (assignmentId: string, assignedClasses: Assignment['assignedClasses']) => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(() => 
    (assignment.assignedClasses || []).map(c => c.classId)
  );
  const { getTeacherClasses, assignAssignmentToClasses } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchClasses = async () => {
        setIsLoading(true);
        try {
          const teacherClasses = await getTeacherClasses();
          setClasses(teacherClasses);
        } catch (error) {
          toast({ title: "Error", description: "Could not fetch classes.", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      };
      fetchClasses();
    }
  }, [isOpen, getTeacherClasses, toast]);

  const handleAssign = async () => {
    setIsAssigning(true);
    try {
      const newAssignedClasses = classes
        .filter(c => selectedClasses.includes(c.id))
        .map(c => ({ classId: c.id, className: c.className }));
        
      await assignAssignmentToClasses(assignment.id, newAssignedClasses);
      onAssignmentAssigned(assignment.id, newAssignedClasses);
      toast({ title: "Success", description: "Assignment has been assigned." });
      setIsOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  };
  
  const handleCheckboxChange = (classId: string, checked: boolean | 'indeterminate') => {
    setSelectedClasses(prev => 
      checked ? [...prev, classId] : prev.filter(id => id !== classId)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
            <Send className="mr-2 h-4 w-4" />
            Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign "{assignment.title}"</DialogTitle>
          <DialogDescription>
            Select the classes you want to assign this quiz to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
          ) : classes.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {classes.map(c => (
                <div key={c.id} className="flex items-center space-x-3 p-2 rounded-md border">
                  <Checkbox 
                    id={`class-${c.id}`} 
                    checked={selectedClasses.includes(c.id)}
                    onCheckedChange={(checked) => handleCheckboxChange(c.id, checked)}
                  />
                  <Label htmlFor={`class-${c.id}`} className="flex-1 cursor-pointer">
                    <p className="font-semibold">{c.className}</p>
                    <p className="text-xs text-muted-foreground">{c.studentIds.length} student(s)</p>
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">You haven't created any classes yet.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={isAssigning || isLoading || selectedClasses.length === 0}>
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


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
  }, [getTeacherAssignments]);

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

  const handleAssignmentUpdated = (assignmentId: string, newAssignedClasses: Assignment['assignedClasses']) => {
    setAssignments(prev => prev.map(a => 
      a.id === assignmentId ? { ...a, assignedClasses: newAssignedClasses } : a
    ));
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
                     {assignment.assignedClasses && assignment.assignedClasses.length > 0 && (
                        <div className="pt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Assigned to:</p>
                            <div className="flex flex-wrap gap-1">
                                {assignment.assignedClasses.map(c => (
                                    <Badge key={c.classId} variant="secondary">{c.className}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
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
                    <AssignDialog assignment={assignment} onAssignmentAssigned={handleAssignmentUpdated} />
                    <Button variant="secondary" className="w-full" asChild>
                        <Link href={`/teacher/assignments/${assignment.id}/edit`}>
                           <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </Button>
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
