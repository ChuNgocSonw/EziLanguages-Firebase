"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowRight, School, BookCopy, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface Stats {
  userCount: number;
  classCount: number;
  assignmentCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getAllUsers, getTeacherClasses, getTeacherAssignments } = useAuth(); // Assuming these can be scoped for admin

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real admin scenario, these functions would fetch ALL data, not just the teacher's.
      // We'll use the existing ones for this prototype.
      const users = await getAllUsers();
      const classes = await getTeacherClasses(); // Placeholder for getAllClasses
      const assignments = await getTeacherAssignments(); // Placeholder for getAllAssignments

      setStats({
        userCount: users.length,
        classCount: classes.length,
        assignmentCount: assignments.length,
      });
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getAllUsers, getTeacherClasses, getTeacherAssignments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    { title: "Total Users", value: stats?.userCount, icon: Users },
    { title: "Total Classes", value: stats?.classCount, icon: School },
    { title: "Total Assignments", value: stats?.assignmentCount, icon: BookCopy },
  ];

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Access tools to manage users, content, and application settings."
      />
      
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight mb-2">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map(stat => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value ?? 0}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold tracking-tight mb-2">Management Tools</h2>
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
             <Button className="w-full" asChild>
                <Link href="/admin/user-management">
                    Manage Users <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Management</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              View and manage all learning content like lessons and exercises.
            </p>
          </CardContent>
          <CardFooter>
             <Button className="w-full" asChild>
                <Link href="/admin/content-management">
                    Manage Content <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
