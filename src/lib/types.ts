
import { z } from "zod";
import type { Timestamp } from "firebase/firestore";

export const UserRole = z.enum(["student", "teacher", "admin", "superadmin"]);
export type UserRole = z.infer<typeof UserRole>;

export const QuestionType = z.enum(['multiple-choice', 'true-false', 'fill-in-the-blank']);
export type QuestionType = z.infer<typeof QuestionType>;

export const AssignmentType = z.enum(['quiz', 'reading', 'listening']);
export type AssignmentType = z.infer<typeof AssignmentType>;

export const QuizQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string(),
  type: QuestionType,
  options: z.array(z.string()).optional(),
  answer: z.string(),
  isAI: z.boolean().optional(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;


export interface QuizAttempt {
  id?: string;
  topic: string;
  questions: QuizQuestion[];
  selectedAnswers: string[];
  score: number;
  percentage: number;
  completedAt: Timestamp;
  assignmentId?: string | null;
}

export interface Class {
  id: string;
  className: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  createdAt: Timestamp;
}

export interface ReadingSentence {
    unit: string;
    text: string;
}

interface BaseExercise {
    id: string;
    text: string;
}
interface TypingExercise extends BaseExercise {
    type: 'typing';
}
interface McqExercise extends BaseExercise {
    type: 'mcq';
    options: string[];
    answer: string;
}
export type ListeningExercise = TypingExercise | McqExercise;

export interface Lesson {
    id: string;
    unit: string;
    content: string; // Combined content for the AI
    activities: {
        reading?: ReadingSentence[];
        listening?: ListeningExercise[];
    },
    teacherId: string;
    createdAt: Timestamp;
}


export interface Assignment {
  id: string;
  title: string;
  language: "EN";
  assignmentType: AssignmentType;
  questions: QuizQuestion[];
  readingSentences: ReadingSentence[];
  listeningExercises: ListeningExercise[];
  teacherId: string;
  createdAt: Timestamp;
  assignedClasses?: string[];
}

export interface Feedback {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  classId: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  isRead: boolean;
}


export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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
    language: z.enum(["EN"]).default("EN").optional(),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

export interface PronunciationAttempt {
  score: number;
  words: { word: string; correct: boolean }[];
  transcribedText: string;
  audioDataUri?: string; // To store the Base64 encoded audio
}

export interface LastActivity {
  type: 'chat' | 'reading' | 'listening' | 'quiz' | 'feedback';
  title: string;
}

export interface CompletedAssignmentDetail {
    assignmentId: string;
    completedAt: Timestamp;
}

export interface UserProfile {
  name: string;
  email: string;
  age: number;
  language: "EN";
  role: UserRole;
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
  classId?: string;
  completedAssignments?: string[];
  completedAssignmentDetails?: CompletedAssignmentDetail[];
}

export interface AdminUserView extends UserProfile {
  uid: string;
  assignmentsCompletedCount?: number;
  completedAssignmentDetails: CompletedAssignmentDetail[];
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


// Duplicating the type from generate-feedback.ts to be used on the client
const PronunciationScoreSchema = z.record(z.string(), z.object({
  score: z.number(),
  transcribedText: z.string(),
}));

const ListeningScoreSchema = z.record(z.string(), z.number());

const QuizAttemptSchema = z.object({
    topic: z.string(),
    score: z.number(),
    percentage: z.number(),
    questions: z.array(z.object({ question: z.string() })).length,
});

export const GenerateFeedbackInputSchema = z.object({
  studentName: z.string().describe("The name of the student receiving the feedback."),
  performanceData: z.object({
      pronunciationScores: z.optional(PronunciationScoreSchema).describe("Student's pronunciation scores. The key is the sentence, value contains score and transcribed text."),
      listeningScores: z.optional(ListeningScoreSchema).describe("Student's listening scores. The key is the exercise ID, value is the XP earned (10 for correct)."),
      quizHistory: z.optional(z.array(QuizAttemptSchema)).describe("History of self-generated quizzes taken by the student."),
      assignmentHistory: z.optional(z.array(QuizAttemptSchema)).describe("History of assigned quizzes taken by the student."),
  }).describe("A collection of the student's performance data across different activities."),
});
export type GenerateFeedbackInput = z.infer<typeof GenerateFeedbackInputSchema>;
