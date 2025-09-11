import { z } from "zod";

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
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
});
export type ProfileFormData = z.infer<typeof profileSchema>;

export interface UserProfile {
  name: string;
  xp: number;
  streak: number;
  badges: string[];
}
