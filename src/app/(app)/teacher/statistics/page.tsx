
"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type { Class, AdminUserView, QuizAttempt } from "@/lib/types";
import { Loader2, Award, Flame, Star, CheckCircle2, BookOpen, Check, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function ReviewStudentAssignmentsDialog({ student, classId }: { student: AdminUserView; classId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const { getStudentAssignmentAttemptsForClass } = useAuth();
    
    useEffect(() => {
        if (isOpen && student.completedAssignmentIds && student.completedAssignmentIds.length > 0) {
            const fetchAttempts = async () => {
                setIsLoading(true);
                try {
                    const studentAttempts = await getStudentAssignmentAttemptsForClass(student.uid, classId);
                    setAttempts(studentAttempts);
                } catch (error) {
                    console.error("Failed to fetch student attempts", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAttempts();
        }
    }, [isOpen, student.uid, classId, student.completedAssignmentIds, getStudentAssignmentAttemptsForClass]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="outline" size="sm" disabled={!student.completedAssignmentIds || student.completedAssignmentIds.length === 0}>
                    <BookOpen className="mr-2 h-4 w-4" /> Review
                 </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Review Assignments for {student.name}</DialogTitle>
                    <DialogDescription>
                        Here are the completed assignments for this student in the selected class.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : attempts.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {attempts.map(attempt => (
                                <AccordionItem value={attempt.id!} key={attempt.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4">
                                            <div>
                                                <p className="font-semibold text-left">{attempt.topic}</p>
                                                <p className="text-sm text-muted-foreground font-normal text-left">
                                                    Completed on {format(attempt.completedAt.toDate(), 'PPP')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-primary">{attempt.percentage}%</p>
                                                <p className="text-sm text-muted-foreground font-normal">
                                                    ({attempt.score}/{attempt.questions.length})
                                                </p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                         <div className="space-y-4 pt-2">
                                            {attempt.questions.map((q, i) => (
                                                <div key={i} className="p-3 border rounded-md bg-muted/50">
                                                    <p className="font-medium">{i + 1}. {q.question}</p>
                                                    <p className={cn("text-sm flex items-center gap-2 mt-2", attempt.selectedAnswers[i] === q.answer ? "text-green-600" : "text-destructive")}>
                                                    {attempt.selectedAnswers[i] === q.answer ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                    Student's answer: {attempt.selectedAnswers[i]}
                                                    </p>
                                                    {attempt.selectedAnswers[i] !== q.answer && <p className="text-sm text-green-700 ml-6">Correct answer: {q.answer}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No assignment attempts found for this student.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function StudentStatisticsTable({ students, totalAssignments, classId }: { students: AdminUserView[], totalAssignments: number, classId: string }) {
    if (students.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>This class has no students yet.</p>
            </div>
        );
    }

    return (
        <>
            <p className="text-sm text-muted-foreground mb-4">
                This class has <span className="font-semibold text-primary">{totalAssignments}</span> assigned {totalAssignments === 1 ? 'quiz' : 'quizzes'}.
            </p>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-center">XP</TableHead>
                        <TableHead className="text-center">Streak</TableHead>
                        <TableHead className="text-center">Badges</TableHead>
                        <TableHead className="text-center">Assignments Completed</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => {
                        return (
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
                             <TableCell>
                                <div className="flex items-center justify-center gap-2">
                                     <div className="flex items-center justify-center gap-1 font-semibold">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        {student.assignmentsCompletedCount} / {totalAssignments}
                                     </div>
                                     <ReviewStudentAssignmentsDialog student={student} classId={classId} />
                                </div>
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        </>
    );
}

export default function TeacherStatisticsPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [students, setStudents] = useState<AdminUserView[]>([]);
    const [totalAssignments, setTotalAssignments] = useState(0);
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
                    const { students: studentData, totalAssignments: assignmentsCount } = await getStudentsForClass(selectedClassId);
                    setStudents(studentData);
                    setTotalAssignments(assignmentsCount);
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
                            <StudentStatisticsTable students={students} totalAssignments={totalAssignments} classId={selectedClassId} />
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
