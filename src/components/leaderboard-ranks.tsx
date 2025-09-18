
"use client";

import { Award, Flame, Star, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import type { LeaderboardEntry } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LeaderboardCategory = "badgeCount" | "weeklyXP" | "streak";

interface UserRanks {
    badgeCount: number | null;
    weeklyXP: number | null;
    streak: number | null;
}

const RankItem = ({ icon: Icon, label, rank, isLoading, color }: { icon: React.ElementType, label: string, rank: number | null, isLoading: boolean, color?: string }) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5 text-muted-foreground", color)} />
                <span className="font-medium">{label}</span>
            </div>
            {isLoading ? (
                 <Skeleton className="h-5 w-16" />
            ) : (
                <span className="font-bold text-primary text-lg">
                    {rank ? `#${rank}` : "Not Ranked"}
                </span>
            )}
        </div>
    );
};


export default function LeaderboardRanks() {
    const { user, getLeaderboard } = useAuth();
    const [ranks, setRanks] = useState<UserRanks>({ badgeCount: null, weeklyXP: null, streak: null });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchRanks = async () => {
            setIsLoading(true);
            try {
                const categories: LeaderboardCategory[] = ["badgeCount", "weeklyXP", "streak"];
                const rankPromises = categories.map(category => getLeaderboard(category));
                const [badgeLeaderboard, weeklyXpLeaderboard, streakLeaderboard] = await Promise.all(rankPromises);
                
                const findRank = (leaderboard: LeaderboardEntry[]) => {
                    const userEntry = leaderboard.find(entry => entry.userId === user.uid);
                    return userEntry ? userEntry.rank : null;
                };

                setRanks({
                    badgeCount: findRank(badgeLeaderboard),
                    weeklyXP: findRank(weeklyXpLeaderboard),
                    streak: findRank(streakLeaderboard),
                });

            } catch (error) {
                console.error("Failed to fetch user ranks:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRanks();
    }, [user, getLeaderboard]);

    return (
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Trophy className="text-amber-500" />
                Your Leaderboard Ranks
            </CardTitle>
            <CardDescription>Your current position across all leaderboards.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <RankItem icon={Award} label="All-Time Badges" rank={ranks.badgeCount} isLoading={isLoading} color="text-blue-500" />
            <RankItem icon={Star} label="Weekly XP" rank={ranks.weeklyXP} isLoading={isLoading} color="text-yellow-500" />
            <RankItem icon={Flame} label="Daily Streak" rank={ranks.streak} isLoading={isLoading} color="text-orange-500" />
          </CardContent>
        </Card>
    );
}
