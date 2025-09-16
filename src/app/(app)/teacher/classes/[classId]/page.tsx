
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, PlusCircle, Trash2, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { AdminUserView, Class } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import useDebounce from "@/hooks/use-debounce";

export default function ManageClassPage() {
  const { classId } = useParams();
  const router = useRouter();
  const { 
    getClassDetails, 
    getStudentsForClassManagement, 
    addStudentToClass, 
    removeStudentFromClass,
    searchStudentsByEmail 
  } = useAuth();
  const { toast } = useToast();

  const [classDetails, setClassDetails] = useState<Class | null>(null);
  const [studentsInClass, setStudentsInClass] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AdminUserView[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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
      
      const students = await getStudentsForClassManagement(classId);
      setStudentsInClass(students);

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
  
  useEffect(() => {
    const performSearch = async () => {
        if (debouncedSearchQuery.length < 3) {
            setSearchResults([]);
            setSearchError(null);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        setSearchError(null);
        try {
            const results = await searchStudentsByEmail(debouncedSearchQuery);
            // Filter out students who are already in the current class
            const availableResults = results.filter(
                (searchedStudent) => !studentsInClass.some((classStudent) => classStudent.uid === searchedStudent.uid)
            );
            
            if (availableResults.length > 0) {
                setSearchResults(availableResults);
            } else {
                setSearchResults([]);
                setSearchError("No available students found with this email, or they are already in this class.");
            }
        } catch (error: any) {
            setSearchError(error.message);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };
    performSearch();
  }, [debouncedSearchQuery, searchStudentsByEmail, studentsInClass]);

  
  const handleAddStudent = async (student: AdminUserView) => {
    if (typeof classId !== 'string') return;
    setIsUpdating(student.uid);
    try {
        await addStudentToClass(classId, student.uid);
        toast({ title: "Success", description: `${student.name} has been added to the class.` });
        
        // Update state directly instead of re-fetching
        setStudentsInClass(prev => [...prev, student].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        setSearchResults(prev => prev.filter(s => s.uid !== student.uid));
        
        // Clear search if no results left to avoid confusion
        if (searchResults.length <= 1) {
            setSearchQuery("");
        }
        
    } catch(error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsUpdating(null);
    }
  }

  const handleRemoveStudent = async (student: AdminUserView) => {
    if (typeof classId !== 'string') return;
    setIsUpdating(student.uid);
    try {
        await removeStudentFromClass(classId, student.uid);
        toast({ title: "Success", description: `${student.name} has been removed from the class.` });
        
        // Update state directly
        setStudentsInClass(prev => prev.filter(s => s.uid !== student.uid));

    } catch(error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsUpdating(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
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
                <div className="space-y-2 max-h-96 overflow-y-auto">
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
                            <Button size="icon" variant="ghost" onClick={() => handleRemoveStudent(student)} disabled={isUpdating === student.uid} className="hover:bg-[#FDECEA]">
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
            <CardTitle>Add Student to Class</CardTitle>
            <CardDescription>Search for available students by their email address.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    type="email" 
                    placeholder="Start typing student's email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
             </div>

             <div className="mt-4 min-h-[80px]">
                {isSearching && (
                    <div className="flex justify-center items-center pt-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
                {searchError && !isSearching && (
                    <p className="text-center text-destructive py-4">{searchError}</p>
                )}
                {searchResults.length > 0 && !isSearching && (
                    <div className="space-y-2">
                        {searchResults.map(student => (
                            <div key={student.uid} className="flex items-center justify-between p-2 rounded-md border bg-muted/50">
                                <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback><UserCircle className="h-5 w-5"/></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                                </div>
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => handleAddStudent(student)} 
                                    disabled={isUpdating === student.uid}
                                    className="text-green-600 hover:bg-[#2E7D32] hover:text-white"
                                >
                                    {isUpdating === student.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-5 w-5"/>}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
