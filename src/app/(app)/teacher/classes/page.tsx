
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, PlusCircle, ArrowRight, Trash2 } from "lucide-react";
import type { Class } from "@/lib/types";
import Link from "next/link";

const createClassSchema = z.object({
  className: z.string().min(3, "Class name must be at least 3 characters.").max(50, "Class name is too long."),
});
type CreateClassFormData = z.infer<typeof createClassSchema>;

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { getTeacherClasses, createClass, deleteClass } = useAuth();
  const { toast } = useToast();

  const form = useForm<CreateClassFormData>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { className: "" },
  });

  useEffect(() => {
    const fetchClasses = async () => {
        setIsLoading(true);
        try {
        const teacherClasses = await getTeacherClasses();
        setClasses(teacherClasses);
        } catch (error) {
        toast({ title: "Error", description: "Failed to fetch classes.", variant: "destructive" });
        } finally {
        setIsLoading(false);
        }
    };
    fetchClasses();
  }, [getTeacherClasses]);

  const onSubmit = async (data: CreateClassFormData) => {
    setIsCreating(true);
    try {
      await createClass(data.className);
      toast({ title: "Success", description: "Class created successfully." });
      form.reset();
      setIsDialogOpen(false);
      
      // Refetch classes after creation
      const teacherClasses = await getTeacherClasses();
      setClasses(teacherClasses);

    } catch (error) {
      toast({ title: "Error", description: "Failed to create class.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleDeleteClass = async (classId: string) => {
    setIsDeleting(classId);
    try {
        await deleteClass(classId);
        toast({ title: "Success", description: "Class deleted successfully." });
        setClasses(prev => prev.filter(c => c.id !== classId));
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to delete class.", variant: "destructive" });
    } finally {
        setIsDeleting(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Your Classes"
        description="Create and manage your classes here."
      />
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Class List</CardTitle>
            <CardDescription>All the classes you have created.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Class</DialogTitle>
                <DialogDescription>
                  Enter a name for your new class to get started.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="className"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., English 101 - Section A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Class
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : classes.length > 0 ? (
            <div className="space-y-3">
              {classes.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <h4 className="font-semibold">{c.className}</h4>
                    <p className="text-sm text-muted-foreground">
                      {c.studentIds.length} student(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/teacher/classes/${c.id}`}>
                        Manage <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isDeleting === c.id} className="hover:bg-[#FDECEA]">
                           {isDeleting === c.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to delete this class?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the class "{c.className}" and remove all students from it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteClass(c.id)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Yes, delete class
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold">No Classes Yet</h3>
              <p className="text-muted-foreground mt-2">
                Click "Create New Class" to set up your first class.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
