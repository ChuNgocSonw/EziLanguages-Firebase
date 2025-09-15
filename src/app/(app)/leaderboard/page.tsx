
"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { LeaderboardEntry } from "@/lib/types";
import { Loader2, Trophy, Award, Flame, Star, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type LeaderboardCategory = "badges" | "weekly-xp" | "streak";

function LeaderboardTable({ data, unit }: { data: LeaderboardEntry[] | null, unit: string }) {
    const { user } = useAuth();
    
    if (!data) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (data.length === 0) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-semibold">No Data Yet</h3>
                <p className="text-muted-foreground mt-2">The leaderboard is empty. Check back soon!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {data.map((entry, index) => {
                const isCurrentUser = user?.uid === entry.userId;
                return (
                    <div key={entry.userId} className={cn(
                        "flex items-center justify-between p-3 rounded-md border",
                        isCurrentUser ? "bg-primary/10 border-primary" : "hover:bg-muted"
                    )}>
                        <div className="flex items-center gap-4">
                             <span className={cn(
                                "font-bold text-lg w-6 text-center",
                                index < 3 && "text-amber-500"
                             )}>
                                {entry.rank}
                            </span>
                            <Avatar className="h-9 w-9">
                                <AvatarFallback><UserCircle className="h-6 w-6 text-muted-foreground"/></AvatarFallback>
                            </Avatar>
                            <div>
                                <h4 className={cn("font-semibold", isCurrentUser && "text-primary")}>
                                    {entry.name || (isCurrentUser ? user.displayName : 'Anonymous User')}
                                    {isCurrentUser && " (You)"}
                                </h4>
                            </div>
                        </div>
                        <div className="font-bold text-lg">
                            {entry.value} {unit}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState<LeaderboardCategory>("badges");
    const [leaderboardData, setLeaderboardData] = useState<Record<LeaderboardCategory, LeaderboardEntry[] | null>>({
        badges: null,
        "weekly-xp": null,
        streak: null,
    });
    const { getLeaderboard } = useAuth();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (leaderboardData[activeTab] !== null) return;
            
            try {
                if (activeTab === "badges") {
                    const data = await getLeaderboard('badgeCount');
                    setLeaderboardData(prev => ({ ...prev, badges: data }));
                } else if (activeTab === "streak") {
                    const data = await getLeaderboard('streak');
                    setLeaderboardData(prev => ({ ...prev, streak: data }));
                } else if (activeTab === "weekly-xp") {
                    const data = await getLeaderboard('weeklyXP');
                    setLeaderboardData(prev => ({ ...prev, "weekly-xp": data }));
                }
            } catch (error) {
                console.error(`Failed to fetch ${activeTab} leaderboard:`, error);
                // Handle error state if necessary
            }
        };

        fetchLeaderboard();
    }, [activeTab, getLeaderboard, leaderboardData]);

    return (
        <>
            <PageHeader
                title="Leaderboards"
                description="See how you stack up against other learners."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LeaderboardCategory)}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="badges">
                                <Award className="mr-2 h-5 w-5" /> All-Time Badges
                            </TabsTrigger>
                            <TabsTrigger value="weekly-xp">
                                <Star className="mr-2 h-5 w-5" /> Weekly XP
                            </TabsTrigger>
                            <TabsTrigger value="streak">
                                <Flame className="mr-2 h-5 w-5" /> Daily Streak
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="badges" className="mt-4">
                            <LeaderboardTable data={leaderboardData.badges} unit="Badges" />
                        </TabsContent>
                        <TabsContent value="weekly-xp" className="mt-4">
                             <LeaderboardTable data={leaderboardData["weekly-xp"]} unit="XP" />
                        </TabsContent>
                        <TabsContent value="streak" className="mt-4">
                            <LeaderboardTable data={leaderboardData.streak} unit="Days" />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}
