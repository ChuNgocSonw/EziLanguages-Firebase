import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BarChart2, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function TeacherPage() {
  return (
    <>
      <PageHeader
        title="Teacher Dashboard"
        description="Manage your lessons, students, and feedback from here."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manage Lessons</CardTitle>
            <PlusCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Create and manage listening, speaking, and quiz exercises.
            </p>
          </CardContent>
          <CardFooter>
             <Button className="w-full" disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Lesson
             </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Statistics</CardTitle>
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground">
              View student progress, scores, and activity analytics.
            </p>
          </CardContent>
           <CardFooter>
             <Button className="w-full" variant="outline" disabled>
                View Statistics
             </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Send Feedback</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground">
              Provide personalized feedback to your students.
            </p>
          </CardContent>
          <CardFooter>
             <Button className="w-full" variant="outline" disabled>
                Send Feedback
             </Button>
          </CardFooter>
        </Card>
      </div>
       <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            These features are currently under development. Stay tuned for updates!
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
