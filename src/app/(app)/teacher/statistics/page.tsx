
"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type { Class, AdminUserView } from "@/lib/types";
import { Loader2, Award, Flame, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function StudentStatisticsTable({ students }: { students: AdminUserView[] }) {
    if (students.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>This class has no students yet.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-center">XP</TableHead>
                    <TableHead className="text-center">Streak</TableHead>
                    <TableHead className="text-center">Badges</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.map((student) => (
                    <TableRow key={student.uid}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{student.name}</div>
                                    <div className="text-xs text-muted-foreground">{student.email}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 font-semibold">
                                <Star className="h-4 w-4 text-yellow-500" />
                                {student.xp}
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                             <div className="flex items-center justify-center gap-1 font-semibold">
                                <Flame className="h-4 w-4 text-orange-500" />
                                {student.streak}
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 font-semibold">
                                <Award className="h-4 w-4 text-blue-500" />
                                {student.badgeCount}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function TeacherStatisticsPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [students, setStudents] = useState<AdminUserView[]>([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const { getTeacherClasses, getStudentsForClass } = useAuth();

    const fetchClasses = useCallback(async () => {
        setIsLoadingClasses(true);
        try {
            const teacherClasses = await getTeacherClasses();
            setClasses(teacherClasses);
        } catch (error) {
            console.error("Failed to fetch classes:", error);
        } finally {
            setIsLoadingClasses(false);
        }
    }, [getTeacherClasses]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);
    
    useEffect(() => {
        if (selectedClassId) {
            const fetchStudents = async () => {
                setIsLoadingStudents(true);
                setStudents([]);
                try {
                    const studentData = await getStudentsForClass(selectedClassId);
                    setStudents(studentData);
                } catch (error) {
                    console.error("Failed to fetch students:", error);
                } finally {
                    setIsLoadingStudents(false);
                }
            };
            fetchStudents();
        }
    }, [selectedClassId, getStudentsForClass]);

    return (
        <>
            <PageHeader
                title="Student Statistics"
                description="View student progress, scores, and activity analytics."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Class Analytics</CardTitle>
                    <CardDescription>Select a class to view detailed statistics for each student.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="max-w-xs space-y-2">
                         <label htmlFor="class-select" className="text-sm font-medium">Select a Class</label>
                        {isLoadingClasses ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Loading classes...</span>
                            </div>
                        ) : (
                            <Select onValueChange={setSelectedClassId} disabled={classes.length === 0}>
                                <SelectTrigger id="class-select">
                                    <SelectValue placeholder={classes.length > 0 ? "Select a class..." : "No classes found"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.className} ({c.studentIds.length} students)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="mt-6 border-t pt-4">
                        {isLoadingStudents ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : selectedClassId ? (
                            <StudentStatisticsTable students={students} />
                        ) : (
                             <div className="text-center py-12 text-muted-foreground">
                                <p>Please select a class to view student statistics.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
