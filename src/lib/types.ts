
import { z } from "zod";
import type { Timestamp } from "firebase/firestore";

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface QuizAttempt {
  id?: string;
  topic: string;
  questions: QuizQuestion[];
  selectedAnswers: string[];
  score: number;
  percentage: number;
  completedAt: Timestamp;
}

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
export type SignupFormData = z.infer<typeof signupSchema>;


export const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address."),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    age: z.coerce.number().min(0, "Age must be a positive number.").optional(),
    language: z.enum(["EN", "JP", "KR", "VI"]).optional(),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

export interface PronunciationAttempt {
  score: number;
  words: { word: string; correct: boolean }[];
  transcribedText: string;
  audioDataUri?: string; // To store the Base64 encoded audio
}

export interface LastActivity {
  type: 'chat' | 'reading' | 'listening' | 'quiz';
  title: string;
}

export interface UserProfile {
  name: string;
  email: string;
  age: number;
  language: string;
  xp: number;
  weeklyXP: number;
  streak: number;
  badges: string[];
  badgeCount: number;
  lastActivityDate?: Timestamp;
  weeklyXPResetDate?: Timestamp;
  pronunciationScores?: { [sentenceKey: string]: PronunciationAttempt };
  listeningScores?: { [exerciseId: string]: number }; // Store XP earned instead of boolean
  lastActivity?: LastActivity;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    value: number;
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: Timestamp;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "bot";
  original?: string;
  response?: string;
  explanation?: string;
  isCorrection?: boolean;
  isTranslation?: boolean;
  suggestions?: string[];
  timestamp: Timestamp;
}
