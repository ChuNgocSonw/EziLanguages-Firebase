import type { UserProfile, QuizAttempt } from './types';
import { Flame, Star, Trophy, Target, BookCheck, Sparkles, Award } from "lucide-react";
import type { LucideIcon } from 'lucide-react';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    condition: (profile: UserProfile, quizHistory?: QuizAttempt[]) => boolean;
}

export const allBadges: Badge[] = [
    // Streak Badges
    {
        id: 'streak-7',
        name: 'Weekly Warrior',
        description: 'Maintained a 7-day learning streak.',
        icon: Flame,
        condition: (profile) => profile.streak >= 7,
    },
    {
        id: 'streak-30',
        name: 'Monthly Master',
        description: 'Maintained a 30-day learning streak.',
        icon: Flame,
        condition: (profile) => profile.streak >= 30,
    },
    // XP Badges
    {
        id: 'xp-1000',
        name: 'XP Explorer',
        description: 'Earned 1,000 XP.',
        icon: Star,
        condition: (profile) => profile.xp >= 1000,
    },
     {
        id: 'xp-5000',
        name: 'XP Champion',
        description: 'Earned 5,000 XP.',
        icon: Award,
        condition: (profile) => profile.xp >= 5000,
    },
    // Quiz Badges
    {
        id: 'quiz-10',
        name: 'Quiz Novice',
        description: 'Completed 10 quizzes.',
        icon: BookCheck,
        condition: (profile, quizHistory) => (quizHistory?.length || 0) >= 10,
    },
     {
        id: 'quiz-50',
        name: 'Quiz Pro',
        description: 'Completed 50 quizzes.',
        icon: Trophy,
        condition: (profile, quizHistory) => (quizHistory?.length || 0) >= 50,
    },
    {
        id: 'quiz-perfect',
        name: 'Perfectionist',
        description: 'Achieved a perfect score (100%) on a quiz.',
        icon: Target,
        condition: (profile, quizHistory) => (quizHistory || []).some(q => q.percentage === 100),
    },
    // Add other badges as needed
];
