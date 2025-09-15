import type { UserProfile, QuizAttempt } from './types';
import { Flame, Star, Trophy, Target, BookCheck, Sparkles, Award, Mic, Headphones, BrainCircuit } from "lucide-react";
import type { LucideIcon } from 'lucide-react';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    condition: (profile: UserProfile, quizHistory?: QuizAttempt[]) => boolean;
}

export const allBadges: Badge[] = [
    // --- Easy Badges ---
    {
        id: 'quiz-1',
        name: 'Quiz Starter',
        description: 'Completed your first quiz.',
        icon: BookCheck,
        condition: (profile, quizHistory) => (quizHistory?.length || 0) >= 1,
    },
    {
        id: 'reading-1',
        name: 'First Words',
        description: 'Completed your first reading pronunciation exercise.',
        icon: Mic,
        condition: (profile) => Object.keys(profile.pronunciationScores || {}).length >= 1,
    },
    {
        id: 'listening-1',
        name: 'Sharp Ears',
        description: 'Completed your first listening exercise.',
        icon: Headphones,
        condition: (profile) => Object.keys(profile.listeningScores || {}).length >= 1,
    },
    {
        id: 'streak-3',
        name: 'Getting Started',
        description: 'Maintained a 3-day learning streak.',
        icon: Flame,
        condition: (profile) => profile.streak >= 3,
    },
    {
        id: 'xp-1000',
        name: 'XP Explorer',
        description: 'Earned 1,000 XP.',
        icon: Star,
        condition: (profile) => profile.xp >= 1000,
    },

    // --- Medium Badges ---
    {
        id: 'streak-7',
        name: 'Weekly Warrior',
        description: 'Maintained a 7-day learning streak.',
        icon: Flame,
        condition: (profile) => profile.streak >= 7,
    },
    {
        id: 'quiz-10',
        name: 'Quiz Novice',
        description: 'Completed 10 quizzes.',
        icon: BookCheck,
        condition: (profile, quizHistory) => (quizHistory?.length || 0) >= 10,
    },
    {
        id: 'quiz-perfect',
        name: 'Perfectionist',
        description: 'Achieved a perfect score (100%) on a quiz.',
        icon: Target,
        condition: (profile, quizHistory) => (quizHistory || []).some(q => q.percentage === 100),
    },
     {
        id: 'xp-5000',
        name: 'XP Champion',
        description: 'Earned 5,000 XP.',
        icon: Award,
        condition: (profile) => profile.xp >= 5000,
    },
    {
        id: 'quiz-50',
        name: 'Quiz Pro',
        description: 'Completed 50 quizzes.',
        icon: Trophy,
        condition: (profile, quizHistory) => (quizHistory?.length || 0) >= 50,
    },

    // --- Hard Badges ---
    {
        id: 'streak-30',
        name: 'Monthly Master',
        description: 'Maintained a 30-day learning streak.',
        icon: Flame,
        condition: (profile) => profile.streak >= 30,
    },
    {
        id: 'xp-10000',
        name: 'XP Legend',
        description: 'Earned 10,000 XP.',
        icon: Sparkles,
        condition: (profile) => profile.xp >= 10000,
    },
    {
        id: 'quiz-100',
        name: 'Quiz Veteran',
        description: 'Completed 100 quizzes.',
        icon: BrainCircuit,
        condition: (profile, quizHistory) => (quizHistory?.length || 0) >= 100,
    },
    {
        id: 'streak-100',
        name: 'Unstoppable',
        description: 'Maintained an incredible 100-day learning streak!',
        icon: Flame,
        condition: (profile) => profile.streak >= 100,
    },
];
