"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Flame, Star, Trophy } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { title: "Daily Streak", value: "5 days", icon: Flame, color: "text-orange-500" },
    { title: "Experience Points", value: "1,250 XP", icon: Star, color: "text-yellow-500" },
    { title: "Badges Earned", value: "8", icon: Award, color: "text-blue-500" },
    { title: "Weekly Rank", value: "#12", icon: Trophy, color: "text-green-500" },
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
              <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
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
