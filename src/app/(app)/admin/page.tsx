
"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowRight, School, BookCopy, BookOpen, Loader2, Users2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Pie, PieChart, ResponsiveContainer, Legend, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { AdminUserView } from "@/lib/types";


interface RoleDistribution {
  name: string;
  value: number;
  fill: string;
}
interface Stats {
  userCount: number;
  classCount: number;
  assignmentCount: number;
  roleDistribution: RoleDistribution[];
}

const chartConfig = {
  student: { label: "Students", color: "hsl(var(--chart-1))" },
  teacher: { label: "Teachers", color: "hsl(var(--chart-2))" },
  admin: { label: "Admins", color: "hsl(var(--chart-3))" },
  superadmin: { label: "Super Admins", color: "hsl(var(--chart-4))" },
};


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getAllUsers, getAllClasses, getAllAssignments } = useAuth();

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const users = await getAllUsers();
      const classes = await getAllClasses(); 
      const assignments = await getAllAssignments(); 

      const roles = users.reduce((acc, user) => {
        const roleKey = user.role.toLowerCase();
        acc[roleKey] = (acc[roleKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const roleDistribution = Object.entries(roles).map(([role, count]) => ({
        name: chartConfig[role as keyof typeof chartConfig]?.label || role,
        value: count,
        fill: chartConfig[role as keyof typeof chartConfig]?.color || "#8884d8",
      }));


      setStats({
        userCount: users.length,
        classCount: classes.length,
        assignmentCount: assignments.length,
        roleDistribution,
      });
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getAllUsers, getAllClasses, getAllAssignments]);

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
      
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <Card className="mb-6">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-muted-foreground" />
                User Role Distribution
            </CardTitle>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 </div>
               ) : (
                <div className="h-[300px]">
                    <ChartContainer config={chartConfig} className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={stats?.roleDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={5}>
                                    {stats?.roleDistribution.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
               )}
        </CardContent>
      </Card>


      <h2 className="text-xl font-bold tracking-tight mb-2">Management Tools</h2>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
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
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
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
