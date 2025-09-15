
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Flame, Star, Trophy } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, userProfile } = useAuth();

  if (!userProfile) {
    return (
       <div>
         <PageHeader
            title={`Welcome Back!`}
            description="Here's a snapshot of your language learning journey. Keep up the great work!"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
              <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
              <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
              <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
          </div>
       </div>
    );
  }

  const stats = [
    { title: "Daily Streak", value: `${userProfile.streak} days`, icon: Flame, color: "text-orange-500" },
    { title: "Experience Points", value: `${userProfile.xp} XP`, icon: Star, color: "text-yellow-500" },
    { title: "Badges Earned", value: userProfile.badgeCount, icon: Award, color: "text-blue-500" },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome Back, ${user?.displayName || 'User'}!`}
        description="Here's a snapshot of your language learning journey. Keep up the great work!"
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <stat.icon className={`h-8 w-8 text-muted-foreground ${stat.color}`} />
                    <div className="text-3xl font-bold">{stat.value}</div>
                </div>
            </CardContent>
          </Card>
        ))}
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-4">
                    <Trophy className={`h-8 w-8 text-muted-foreground text-amber-500`} />
                    <div className="text-3xl font-bold">Top Tier</div>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href="/leaderboard">View Rankings</Link>
                </Button>
            </CardContent>
          </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your next recommended lesson is "Mastering Past Tense".</p>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            You are in the top 10% this week!
          </CardContent>
        </Card>
      </div>
    </>
  );
}
