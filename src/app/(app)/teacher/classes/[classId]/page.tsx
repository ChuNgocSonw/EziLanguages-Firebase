
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { AdminUserView, Class } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";

export default function ManageClassPage() {
  const { classId } = useParams();
  const router = useRouter();
  const { getClassDetails, getStudentsForClassManagement, addStudentToClass, removeStudentFromClass } = useAuth();
  const { toast } = useToast();

  const [classDetails, setClassDetails] = useState<Class | null>(null);
  const [studentsInClass, setStudentsInClass] = useState<AdminUserView[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Store student ID being updated

  const fetchClassData = useCallback(async () => {
    if (typeof classId !== 'string') return;
    setIsLoading(true);
    try {
      const details = await getClassDetails(classId);
      if (!details) {
        toast({ title: "Error", description: "Class not found.", variant: "destructive" });
        router.push("/teacher/classes");
        return;
      }
      setClassDetails(details);
      
      const { studentsInClass, availableStudents } = await getStudentsForClassManagement(classId);
      setStudentsInClass(studentsInClass);
      setAvailableStudents(availableStudents);

    } catch (error) {
      console.error("Failed to fetch class data:", error);
      toast({ title: "Error", description: "Could not load class data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [classId, getClassDetails, getStudentsForClassManagement, toast, router]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);
  
  const handleAddStudent = async (studentId: string) => {
    if (typeof classId !== 'string') return;
    setIsUpdating(studentId);
    try {
        await addStudentToClass(classId, studentId);
        toast({ title: "Success", description: "Student added to the class." });
        
        // Optimistic UI update
        const studentToAdd = availableStudents.find(s => s.uid === studentId);
        if (studentToAdd) {
            setStudentsInClass(prev => [...prev, studentToAdd].sort((a, b) => a.name.localeCompare(b.name)));
            setAvailableStudents(prev => prev.filter(s => s.uid !== studentId));
        }

    } catch(error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        // Revert UI on error
        await fetchClassData();
    } finally {
        setIsUpdating(null);
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (typeof classId !== 'string') return;
    setIsUpdating(studentId);
    try {
        await removeStudentFromClass(classId, studentId);
        toast({ title: "Success", description: "Student removed from the class." });

        // Optimistic UI update
        const studentToRemove = studentsInClass.find(s => s.uid === studentId);
        if (studentToRemove) {
            setAvailableStudents(prev => [...prev, studentToRemove].sort((a, b) => a.name.localeCompare(b.name)));
            setStudentsInClass(prev => prev.filter(s => s.uid !== studentId));
        }

    } catch(error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        // Revert UI on error
        await fetchClassData();
    } finally {
        setIsUpdating(null);
    }
  }


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Manage Class: ${classDetails?.className || ""}`}
        description="Add or remove students from this class."
      />
       <div className="mb-4">
        <Button variant="outline" onClick={() => router.push('/teacher/classes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Classes
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Students in this Class ({studentsInClass.length})</CardTitle>
            <CardDescription>These students are currently enrolled.</CardDescription>
          </CardHeader>
          <CardContent>
            {studentsInClass.length > 0 ? (
                <div className="space-y-2">
                    {studentsInClass.map(student => (
                        <div key={student.uid} className="flex items-center justify-between p-2 rounded-md border">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => handleRemoveStudent(student.uid)} disabled={isUpdating === student.uid}>
                                {isUpdating === student.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive"/>}
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">No students in this class yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Students ({availableStudents.length})</CardTitle>
            <CardDescription>Students not currently in any class.</CardDescription>
          </CardHeader>
          <CardContent>
             {availableStudents.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableStudents.map(student => (
                         <div key={student.uid} className="flex items-center justify-between p-2 rounded-md border">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => handleAddStudent(student.uid)} disabled={isUpdating === student.uid} className="text-green-600 hover:bg-[#2E7D32] hover:text-white">
                               {isUpdating === student.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4"/>}
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">All students have been assigned to a class.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
