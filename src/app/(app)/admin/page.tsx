
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Access tools to manage users, content, and application settings."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Management</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              View, edit, and assign roles to all users in the system.
            </p>
          </CardContent>
          <CardFooter>
             <Button className="w-full bg-accent hover:bg-accent/90" asChild>
                <Link href="/admin/user-management">
                    Manage Users <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
