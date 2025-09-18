
'use server';
/**
 * @fileOverview A Genkit flow for generating student feedback based on their performance data.
 *
 * - generateFeedback - A function that takes a student's performance data and generates a constructive feedback message.
 * - GenerateFeedbackInput - The input type for the generateFeedback function.
 * - GenerateFeedbackOutput - The return type for the generateFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { PronunciationAttempt, QuizAttempt } from '@/lib/types';

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

const GenerateFeedbackInputSchema = z.object({
  studentName: z.string().describe("The name of the student receiving the feedback."),
  performanceData: z.object({
      pronunciationScores: z.optional(PronunciationScoreSchema).describe("Student's pronunciation scores. The key is the sentence, value contains score and transcribed text."),
      listeningScores: z.optional(ListeningScoreSchema).describe("Student's listening scores. The key is the exercise ID, value is the XP earned (10 for correct)."),
      quizHistory: z.optional(z.array(QuizAttemptSchema)).describe("History of self-generated quizzes taken by the student."),
      assignmentHistory: z.optional(z.array(QuizAttemptSchema)).describe("History of assigned quizzes taken by the student."),
  }).describe("A collection of the student's performance data across different activities."),
});
export type GenerateFeedbackInput = z.infer<typeof GenerateFeedbackInputSchema>;


const GenerateFeedbackOutputSchema = z.object({
  title: z.string().describe("A concise and relevant title for the feedback message. For example: 'Feedback on Your Recent Progress' or 'Great Work on Pronunciation!'."),
  feedbackText: z.string().describe('The fully generated, well-structured, and encouraging feedback message.'),
});
export type GenerateFeedbackOutput = z.infer<typeof GenerateFeedbackOutputSchema>;


export async function generateFeedback(input: GenerateFeedbackInput): Promise<GenerateFeedbackOutput> {
  return generateFeedbackFlow(input);
}


const generateFeedbackPrompt = ai.definePrompt({
  name: 'generateFeedbackPrompt',
  input: { schema: z.object({ studentName: z.string(), performanceDataJson: z.string() }) },
  output: { schema: GenerateFeedbackOutputSchema },
  prompt: `You are an expert AI assistant for a language teacher. Your task is to analyze a student's performance data and compose a constructive, encouraging, and personalized feedback message.

You MUST generate both a suitable title and the full feedback content.

**Analysis Guidelines:**
1.  **Review all provided data**: Look at pronunciation, listening, self-generated quizzes, and assigned quizzes.
2.  **Identify Strengths**: Find areas where the student is doing well. This could be high scores in pronunciation, consistent quiz performance, or perfect scores on assignments. Start the feedback by highlighting these positive points.
3.  **Identify Areas for Improvement**: Find areas where the student is struggling. This could be low pronunciation scores on certain sentences, low scores on quizzes about specific topics (e.g., tenses, idioms), or poor performance on assignments.
4.  **Provide Actionable Advice**: For each area of improvement, suggest specific actions. For example, if pronunciation is weak, suggest they re-practice those sentences. If a quiz topic is a problem, suggest they generate more quizzes on that topic.
5.  **Maintain a Supportive Tone**: The feedback should be encouraging and motivating, not critical. Frame areas for improvement as opportunities for growth.

**Student's Name**: {{{studentName}}}

**Performance Data (JSON format):**
\`\`\`json
{{{performanceDataJson}}}
\`\`\`
`,
});

const generateFeedbackFlow = ai.defineFlow(
  {
    name: 'generateFeedbackFlow',
    inputSchema: GenerateFeedbackInputSchema,
    outputSchema: GenerateFeedbackOutputSchema,
  },
  async (input) => {
    const performanceDataJson = JSON.stringify(input.performanceData, null, 2);
    
    const { output } = await generateFeedbackPrompt({
        studentName: input.studentName,
        performanceDataJson: performanceDataJson,
    });
    return output!;
  }
);
