
"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import type { Class, AdminUserView, Feedback, PerformanceQuizAttempt } from "@/lib/types";
import { Loader2, Send, Check, User, ChevronRight, MessageSquare, Trash2, Wand2, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { generateFeedback } from "@/lib/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const feedbackSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  content: z.string().min(10, "Content must be at least 10 characters."),
});
type FeedbackFormData = z.infer<typeof feedbackSchema>;

export default function TeacherFeedbackPage() {
  const { 
    getTeacherClasses, 
    getStudentsForClassManagement, 
    sendFeedback,
    getSentFeedback,
    deleteFeedback,
    getStudentPerformanceDataForFeedback,
  } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<AdminUserView[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [aiLanguage, setAiLanguage] = useState("English");
  
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [sentFeedback, setSentFeedback] = useState<Feedback[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { title: "", content: "" },
  });

  const fetchClasses = useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const teacherClasses = await getTeacherClasses();
      setClasses(teacherClasses);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch classes.", variant: "destructive" });
    } finally {
      setIsLoadingClasses(false);
    }
  }, [getTeacherClasses, toast]);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const feedbackHistory = await getSentFeedback();
      setSentFeedback(feedbackHistory);
    } catch (error) {
       toast({ title: "Error", description: "Could not fetch feedback history.", variant: "destructive" });
    } finally {
        setIsLoadingHistory(false);
    }
  }, [getSentFeedback, toast]);


  useEffect(() => {
    fetchClasses();
    fetchHistory();
  }, [fetchClasses, fetchHistory]);

  useEffect(() => {
    if (selectedClassId) {
      const fetchStudents = async () => {
        setIsLoadingStudents(true);
        setStudents([]);
        setSelectedStudentIds([]);
        try {
          const classStudents = await getStudentsForClassManagement(selectedClassId);
          setStudents(classStudents);
        } catch (error) {
          toast({ title: "Error", description: "Could not fetch students for this class.", variant: "destructive" });
        } finally {
          setIsLoadingStudents(false);
        }
      };
      fetchStudents();
    } else {
        setStudents([]);
        setSelectedStudentIds([]);
    }
  }, [selectedClassId, getStudentsForClassManagement, toast]);

  const handleSelectAllStudents = (checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedStudentIds(students.map(s => s.uid));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean | 'indeterminate') => {
    setSelectedStudentIds(prev =>
      checked ? [...prev, studentId] : prev.filter(id => id !== studentId)
    );
  };
  
  const onSubmit = async (data: FeedbackFormData) => {
    if (!selectedClassId || selectedStudentIds.length === 0) {
        toast({ title: "Error", description: "Please select a class and at least one student.", variant: "destructive"});
        return;
    }
    setIsSending(true);
    try {
        const studentDetails = students.filter(s => selectedStudentIds.includes(s.uid)).map(s => ({ studentId: s.uid, studentName: s.name }));
        await sendFeedback(selectedClassId, studentDetails, data.title, data.content);
        toast({ title: "Success!", description: `Feedback sent to ${selectedStudentIds.length} student(s).`});
        form.reset();
        setSelectedStudentIds([]);
        fetchHistory();
    } catch (error: any) {
        toast({ title: "Send Failed", description: error.message, variant: "destructive"});
    } finally {
        setIsSending(false);
    }
  };

  const handleGenerateFeedback = async () => {
    if (selectedStudentIds.length === 0) {
        toast({ title: "Student required", description: "Please select one student to generate feedback for.", variant: "destructive"});
        return;
    }
    if (selectedStudentIds.length > 1) {
        toast({ title: "Select only one student", description: "AI analysis currently works for one student at a time.", variant: "destructive"});
        return;
    }

    setIsGenerating(true);
    try {
        const studentId = selectedStudentIds[0];
        const performanceData = await getStudentPerformanceDataForFeedback(studentId);
        
        const result = await generateFeedback({
            studentName: performanceData.studentName,
            performanceData: performanceData.performanceData,
            language: aiLanguage,
        });
        
        form.setValue("title", result.title);
        form.setValue("content", result.feedbackText);
        toast({ title: "Feedback Generated!", description: "AI has drafted a feedback message for you below." });

    } catch (error: any) {
        toast({ title: "Generation Failed", description: error.message || "Could not analyze student data.", variant: "destructive"});
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    setIsDeleting(feedbackId);
    try {
        await deleteFeedback(feedbackId);
        toast({ title: "Success", description: "Feedback has been deleted."});
        setSentFeedback(prev => prev.filter(f => f.id !== feedbackId));
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive"});
    } finally {
        setIsDeleting(null);
    }
  }


  return (
    <>
      <PageHeader
        title="Send Feedback"
        description="Provide personalized feedback to your students."
      />
      <Tabs defaultValue="send">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send"><Send className="mr-2 h-4 w-4"/>Send New Feedback</TabsTrigger>
            <TabsTrigger value="history"><MessageSquare className="mr-2 h-4 w-4"/>Sent History</TabsTrigger>
        </TabsList>
        <TabsContent value="send" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Compose Feedback</CardTitle>
                    <CardDescription>Select recipients and write your feedback message, or use the AI assistant to analyze student data and draft a message for you.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">1. Select Recipients</h3>
                                <div className="space-y-2">
                                <Label htmlFor="class-select">Select a Class</Label>
                                {isLoadingClasses ? (
                                    <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" /> Loading classes...</div>
                                ) : (
                                    <Select 
                                      value={selectedClassId || ""}
                                      onValueChange={setSelectedClassId} 
                                      disabled={classes.length === 0}
                                    >
                                      <SelectTrigger id="class-select"><SelectValue placeholder="Select a class..." /></SelectTrigger>
                                      <SelectContent>
                                          {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.className}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                )}
                                </div>
                                <div className="space-y-2">
                                <Label>Select Students</Label>
                                <Card className="max-h-60 overflow-y-auto">
                                    <CardContent className="p-2">
                                    {isLoadingStudents ? (
                                        <div className="flex justify-center items-center p-4"><Loader2 className="animate-spin" /></div>
                                    ) : students.length > 0 ? (
                                        <div className="space-y-2">
                                        <div className="flex items-center space-x-3 p-2 rounded-md border bg-muted/50">
                                            <Checkbox
                                            id="select-all"
                                            checked={selectedStudentIds.length === students.length && students.length > 0}
                                            onCheckedChange={handleSelectAllStudents}
                                            />
                                            <Label htmlFor="select-all" className="font-semibold">Select All</Label>
                                        </div>
                                        {students.map(student => (
                                            <div key={student.uid} className="flex items-center space-x-3 p-2 rounded-md">
                                            <Checkbox
                                                id={`student-${student.uid}`}
                                                checked={selectedStudentIds.includes(student.uid)}
                                                onCheckedChange={(checked) => handleSelectStudent(student.uid, checked)}
                                            />
                                            <Label htmlFor={`student-${student.uid}`} className="flex-1 cursor-pointer">{student.name}</Label>
                                            </div>
                                        ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground p-4">
                                        {selectedClassId ? "This class has no students." : "Please select a class first."}
                                        </p>
                                    )}
                                    </CardContent>
                                </Card>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">2. Write Message</h3>
                                 <div className="flex justify-start mt-2">
                                    <div className="flex items-center gap-2">
                                        <Select value={aiLanguage} onValueChange={setAiLanguage}>
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="English">English</SelectItem>
                                                <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button type="button" variant="outline" size="sm" onClick={handleGenerateFeedback} disabled={isGenerating}>
                                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                            Generate with AI
                                        </Button>
                                    </div>
                                </div>
                                <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl><Input placeholder="e.g., Feedback on your last quiz" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                                <FormField control={form.control} name="content" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl><Textarea placeholder="Write your detailed feedback here, or generate it with AI." {...field} rows={10} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSending} className="bg-accent hover:bg-accent/90">
                                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Feedback to {selectedStudentIds.length} Student(s) <Send className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </Form>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Sent Feedback History</CardTitle>
                    <CardDescription>A log of all the feedback you've sent.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingHistory ? (
                        <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                    ) : sentFeedback.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {sentFeedback.map(fb => (
                                <AccordionItem value={fb.id} key={fb.id}>
                                    <div className="flex items-center justify-between w-full">
                                        <AccordionTrigger className="flex-1 hover:no-underline pr-2">
                                            <div className="grid grid-cols-[1fr_auto] items-center w-full gap-x-4 text-left">
                                                {/* Row 1 */}
                                                <p className="font-semibold truncate">{fb.title}</p>
                                                <div className="text-xs text-muted-foreground font-normal flex items-center justify-end gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Sent: {format(fb.createdAt.toDate(), 'PPP')}</span>
                                                </div>
                                                {/* Row 2 */}
                                                <p className="text-sm text-muted-foreground font-normal flex items-center gap-1 truncate">
                                                    <User className="h-3 w-3 shrink-0" />
                                                    <span>To: {fb.studentName}</span>
                                                </p>
                                                <div className="text-xs text-muted-foreground font-normal flex items-center justify-end gap-1">
                                                    {fb.isRead ? <Check className="h-4 w-4 text-green-600"/> : <ChevronRight className="h-4 w-4"/>}
                                                    <span>{fb.isRead ? "Read" : "Sent"}</span>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isDeleting === fb.id} className="shrink-0 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                                                    {isDeleting === fb.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this feedback. The student will no longer be able to see it.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteFeedback(fb.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <AccordionContent>
                                        <div className="prose dark:prose-invert max-w-none p-2 bg-muted/50 rounded-md">
                                            <p style={{ whiteSpace: 'pre-wrap' }}>{fb.content}</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-semibold">No Feedback Sent</h3>
                            <p className="text-muted-foreground mt-2">Your sent feedback will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
