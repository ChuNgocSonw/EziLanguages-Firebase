
"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type { Class, AdminUserView, QuizAttempt, Assignment, PronunciationAttempt, Lesson } from "@/lib/types";
import { Loader2, Award, Flame, Star, CheckCircle2, BookOpen, Check, X, Mic, Headphones } from "lucide-react";
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

// Helper to create a Firestore-safe key from a sentence
const createSafeKey = (sentence: string) => sentence.replace(/[.#$[\]/]/g, '_');


function ReviewStudentAssignmentsDialog({ student, classId }: { student: AdminUserView; classId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
    const { getStudentAssignmentAttemptsForClass, getStudentAssignments } = useAuth();
    
    useEffect(() => {
        if (isOpen && student.completedAssignmentDetails && student.completedAssignmentDetails.length > 0) {
            const fetchAttempts = async () => {
                setIsLoading(true);
                try {
                    const allAssignments = await getStudentAssignments(student);
                    const completedAssignments = allAssignments.filter(a => 
                        student.completedAssignmentDetails.some(completed => completed.assignmentId === a.id)
                    );
                    setAssignments(completedAssignments);
                    
                    const quizAssignments = completedAssignments.filter(a => a.assignmentType === 'quiz');
                    if (quizAssignments.length > 0) {
                        const studentAttempts = await getStudentAssignmentAttemptsForClass(student.uid, classId);
                        setQuizAttempts(studentAttempts);
                    }
                } catch (error) {
                    console.error("Failed to fetch student attempts", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAttempts();
        }
    }, [isOpen, student, classId, getStudentAssignmentAttemptsForClass, getStudentAssignments]);
    
    const getQuizAttemptForAssignment = (assignmentId: string) => {
        return quizAttempts.find(attempt => attempt.assignmentId === assignmentId);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="outline" size="sm" disabled={!student.completedAssignmentDetails || student.completedAssignmentDetails.length === 0}>
                    <BookOpen className="mr-2 h-4 w-4" /> Review
                 </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Review Assignments for {student.name}</DialogTitle>
                    <DialogDescription>
                        Here are the completed assignments for this student in the selected class.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 max-h-[70vh] overflow-y-auto pr-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : assignments.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {assignments.map(assignment => {
                                const completedDetail = student.completedAssignmentDetails.find(d => d.assignmentId === assignment.id);
                                const quizAttempt = assignment.assignmentType === 'quiz' ? getQuizAttemptForAssignment(assignment.id) : undefined;
                                
                                return (
                                <AccordionItem value={assignment.id} key={assignment.id}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex justify-between w-full pr-4 items-center">
                                            <div className="text-left">
                                                <p className="font-semibold">{assignment.title}</p>
                                                <p className="text-sm text-muted-foreground font-normal capitalize">
                                                    {assignment.assignmentType} &bull; Completed on {completedDetail ? format(completedDetail.completedAt.toDate(), 'PPP') : 'N/A'}
                                                </p>
                                            </div>
                                            {quizAttempt && (
                                                <div className="text-right">
                                                    <p className="font-semibold text-primary">{quizAttempt.percentage}%</p>
                                                    <p className="text-sm text-muted-foreground font-normal">
                                                        ({quizAttempt.score}/{quizAttempt.questions.length})
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {assignment.assignmentType === 'quiz' && quizAttempt && (
                                             <div className="space-y-4 pt-2">
                                                {quizAttempt.questions.map((q, i) => (
                                                    <div key={i} className="p-3 border rounded-md bg-muted/50">
                                                        <p className="font-medium">{i + 1}. {q.question}</p>
                                                        <p className={cn("text-sm flex items-center gap-2 mt-2", quizAttempt.selectedAnswers[i] === q.answer ? "text-green-600" : "text-destructive")}>
                                                        {quizAttempt.selectedAnswers[i] === q.answer ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                        Student's answer: {quizAttempt.selectedAnswers[i]}
                                                        </p>
                                                        {quizAttempt.selectedAnswers[i] !== q.answer && <p className="text-sm text-green-700 ml-6">Correct answer: {q.answer}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {assignment.assignmentType === 'reading' && (
                                            <div className="space-y-3 pt-2">
                                                {assignment.readingSentences?.map((sentence, i) => {
                                                    const score = student.pronunciationScores?.[createSafeKey(sentence.text)];
                                                    return (
                                                        <div key={i} className="p-3 border rounded-md bg-muted/50">
                                                            <p className="font-medium mb-2">{i + 1}. {sentence.text}</p>
                                                            {score ? (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Mic className="h-4 w-4 text-primary" />
                                                                    <span>Student's Best Score:</span>
                                                                    <span className="font-bold text-primary">{score.score}%</span>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">No score recorded for this sentence.</p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {assignment.assignmentType === 'listening' && (
                                            <div className="space-y-3 pt-2">
                                                {assignment.listeningExercises?.map((exercise, i) => {
                                                    const wasCorrect = student.listeningScores?.[exercise.id];
                                                    return (
                                                        <div key={i} className="p-3 border rounded-md bg-muted/50">
                                                            <p className="font-medium mb-2">{i + 1}. {exercise.text}</p>
                                                            <div className={cn("text-sm flex items-center gap-2", wasCorrect ? "text-green-600" : "text-destructive")}>
                                                                {wasCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                                Student answered this exercise {wasCorrect ? "correctly" : "incorrectly"}.
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                                )
                            })}
                        </Accordion>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No completed assignments found for this student.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function StudentStatisticsTable({ students, totalAssignments, totalLessons, selectedClassId }: { students: AdminUserView[], totalAssignments: number, totalLessons: number, selectedClassId: string | null }) {
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
                This class has <span className="font-semibold text-primary">{totalAssignments}</span> assigned {totalAssignments === 1 ? 'assignment' : 'assignments'} and <span className="font-semibold text-primary">{totalLessons}</span> available {totalLessons === 1 ? 'lesson' : 'lessons'}.
            </p>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-center">XP</TableHead>
                        <TableHead className="text-center">Streak</TableHead>
                        <TableHead className="text-center">Badges</TableHead>
                        <TableHead className="text-center">Reading Units</TableHead>
                        <TableHead className="text-center">Listening Units</TableHead>
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
                             <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1 font-semibold">
                                    <Mic className="h-4 w-4 text-indigo-500" />
                                    {student.readingUnitsCompleted} / {totalLessons}
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1 font-semibold">
                                    <Headphones className="h-4 w-4 text-cyan-500" />
                                    {student.listeningUnitsCompleted} / {totalLessons}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-center gap-4">
                                     <div className="flex items-center justify-center gap-1 font-semibold">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        {student.assignmentsCompletedCount} / {totalAssignments}
                                     </div>
                                     <ReviewStudentAssignmentsDialog student={student} classId={selectedClassId!} />
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
    const [totalLessons, setTotalLessons] = useState(0);
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
                    const { students: studentData, totalAssignments: assignmentsCount, totalLessons: lessonsCount } = await getStudentsForClass(selectedClassId);
                    setStudents(studentData);
                    setTotalAssignments(assignmentsCount);
                    setTotalLessons(lessonsCount);
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
                            <StudentStatisticsTable students={students} totalAssignments={totalAssignments} totalLessons={totalLessons} selectedClassId={selectedClassId} />
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

    

    