
"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { LeaderboardEntry } from "@/lib/types";
import { Loader2, Trophy, Award, Flame, Star, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LeaderboardCategory = "badges" | "weekly-xp" | "streak";

const leaderboardOptions: { value: LeaderboardCategory; label: string; icon: React.ElementType; unit: string }[] = [
    { value: "badges", label: "All-Time Badges", icon: Award, unit: "Badges" },
    { value: "weekly-xp", label: "Weekly XP", icon: Star, unit: "XP" },
    { value: "streak", label: "Daily Streak", icon: Flame, unit: "Days" },
];

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
        <div className="space-y-3 mt-4">
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
                            <div className="flex flex-col">
                                <h4 className={cn("font-semibold", isCurrentUser && "text-primary")}>
                                    {entry.name || (isCurrentUser ? user.displayName : 'Anonymous User')}
                                    {isCurrentUser && " (You)"}
                                </h4>
                            </div>
                        </div>
                        <div className="font-bold text-lg text-right">
                            {entry.value} {unit}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function LeaderboardPage() {
    const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>("badges");
    const [leaderboardData, setLeaderboardData] = useState<Record<LeaderboardCategory, LeaderboardEntry[] | null>>({
        badges: null,
        "weekly-xp": null,
        streak: null,
    });
    const { getLeaderboard } = useAuth();

    const fetchLeaderboard = useCallback(async (category: LeaderboardCategory) => {
        // No need to refetch if data already exists
        if (leaderboardData[category] !== null) return;
        
        try {
            let data: LeaderboardEntry[] = [];
            if (category === "badges") {
                data = await getLeaderboard('badgeCount');
            } else if (category === "streak") {
                data = await getLeaderboard('streak');
            } else if (category === "weekly-xp") {
                data = await getLeaderboard('weeklyXP');
            }
            setLeaderboardData(prev => ({ ...prev, [category]: data }));
        } catch (error) {
            console.error(`Failed to fetch ${category} leaderboard:`, error);
        }
    }, [getLeaderboard, leaderboardData]);

    useEffect(() => {
        fetchLeaderboard(activeCategory);
    }, [activeCategory, fetchLeaderboard]);
    
    const selectedOption = leaderboardOptions.find(opt => opt.value === activeCategory);

    return (
        <>
            <PageHeader
                title="Leaderboards"
                description="See how you stack up against other learners."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Rankings</CardTitle>
                     <CardDescription>Select a category to view the leaderboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={activeCategory} onValueChange={(value) => setActiveCategory(value as LeaderboardCategory)}>
                        <SelectTrigger className="w-full md:w-[280px]">
                            <SelectValue placeholder="Select a leaderboard..." />
                        </SelectTrigger>
                        <SelectContent>
                            {leaderboardOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
                                        <option.icon className="h-5 w-5" />
                                        <span>{option.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    {selectedOption && (
                        <LeaderboardTable data={leaderboardData[activeCategory]} unit={selectedOption.unit} />
                    )}

                </CardContent>
            </Card>
        </>
    );
}
