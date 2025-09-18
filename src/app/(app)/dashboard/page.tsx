
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Flame, Star, Trophy, ArrowRight, MessageSquare, BookOpen, Headphones, ClipboardList } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LeaderboardRanks from "@/components/leaderboard-ranks";
import React from "react";

const activityIcons = {
    chat: MessageSquare,
    reading: BookOpen,
    listening: Headphones,
    quiz: ClipboardList,
};

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

  const lastActivity = userProfile.lastActivity;
  const LastActivityIcon = lastActivity ? activityIcons[lastActivity.type] : null;

  return (
    <>
      <PageHeader
        title={`Welcome Back, ${user?.displayName || 'User'}!`}
        description="Here's a snapshot of your language learning journey. Keep up the great work!"
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    <div className="text-3xl font-bold">{stat.value}</div>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <CardContent>
             {lastActivity ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {LastActivityIcon && <LastActivityIcon className="h-6 w-6 text-primary" />}
                        <div>
                            <p className="text-sm text-muted-foreground">You last practiced:</p>
                            <p className="font-semibold">{lastActivity.title}</p>
                        </div>
                    </div>
                    <Button asChild className="ml-auto shrink-0 bg-accent hover:bg-accent/90">
                        <Link href={`/${lastActivity.type}`}>
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            ) : (
                <p>Start your first lesson in any category to begin your journey!</p>
            )}
          </CardContent>
        </Card>

        <LeaderboardRanks />
      </div>
    </>
  );
}
