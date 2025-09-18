
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, MessageSquare, BookUser, BookCopy } from "lucide-react";
import Link from "next/link";

export default function TeacherPage() {
  return (
    <>
      <PageHeader
        title="Teacher Dashboard"
        description="Manage your classes, students, and feedback from here."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manage Classes</CardTitle>
            <BookUser className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-xs text-muted-foreground">
              Create classes and add your students to track their progress.
            </p>
          </CardContent>
          <CardFooter>
             <Button className="w-full" asChild>
                <Link href="/teacher/classes">
                    Manage Your Classes
                </Link>
             </Button>
          </CardFooter>
        </Card>
         <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manage Assignments</CardTitle>
            <BookCopy className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1">
             <p className="text-xs text-muted-foreground">
              Create and assign quizzes to your classes.
            </p>
          </CardContent>
           <CardFooter>
             <Button className="w-full" asChild>
                <Link href="/teacher/assignments">
                    Manage Assignments
                </Link>
             </Button>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Statistics</CardTitle>
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1">
             <p className="text-xs text-muted-foreground">
              View student progress, scores, and activity analytics.
            </p>
          </CardContent>
           <CardFooter>
             <Button className="w-full" asChild>
                <Link href="/teacher/statistics">View Statistics</Link>
             </Button>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Send Feedback</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1">
             <p className="text-xs text-muted-foreground">
              Provide personalized feedback to your students.
            </p>
          </CardContent>
          <CardFooter>
             <Button className="w-full" asChild>
                <Link href="/teacher/feedback">Send Feedback</Link>
             </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
