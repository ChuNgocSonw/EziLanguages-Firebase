
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
import type { PronunciationAttempt, PerformanceQuizAttempt } from '@/lib/types';

const PronunciationScoreSchema = z.record(z.string(), z.object({
  score: z.number(),
  transcribedText: z.string(),
}));

const ListeningScoreSchema = z.record(z.string(), z.number());

const PerformanceQuizAttemptSchema = z.object({
    topic: z.string(),
    score: z.number(),
    percentage: z.number(),
    questions: z.array(z.object({ question: z.string() })).length,
    completedAt: z.string().describe("The ISO date string when the quiz was completed."),
});

const GenerateFeedbackInputSchema = z.object({
  studentName: z.string().describe("The name of the student receiving the feedback."),
  performanceData: z.object({
      pronunciationScores: z.optional(PronunciationScoreSchema).describe("Student's pronunciation scores. The key is the sentence, value contains score and transcribed text."),
      listeningScores: z.optional(ListeningScoreSchema).describe("Student's listening scores. The key is the exercise ID, value is the XP earned (10 for correct)."),
      quizHistory: z.optional(z.array(PerformanceQuizAttemptSchema)).describe("History of self-generated quizzes taken by the student."),
      assignmentHistory: z.optional(z.array(PerformanceQuizAttemptSchema)).describe("History of assigned quizzes taken by the student."),
  }).describe("A collection of the student's performance data across different activities."),
  language: z.string().optional().default('English').describe("The language for the feedback message. Can be 'English' or 'Vietnamese'."),
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
  input: { schema: z.object({ studentName: z.string(), performanceDataJson: z.string(), language: z.string() }) },
  output: { schema: GenerateFeedbackOutputSchema },
  prompt: `You are an expert AI assistant for a language teacher. Your task is to analyze a student's performance data and compose a constructive, encouraging, and personalized feedback message.

You MUST generate both a suitable title and the full feedback content.
You MUST write the entire feedback message (both title and content) in the following language: {{{language}}}.

**CRITICAL FORMATTING RULES:**
- Structure the feedback into clear, separate paragraphs. Each paragraph should be separated by a blank line.
- Ensure correct spelling and grammar.
- Always add a space after punctuation marks like commas (,), periods (.), and exclamation marks (!). For example, write "Hello, User." instead of "Hello,User.".
- Maintain a supportive, encouraging, and motivating tone throughout the message.

**ANALYSIS GUIDELINES:**

1.  **Check for Performance Data**: Look at the provided JSON data.

2.  **If Performance Data is EMPTY ({}):**
    This means the student is new. You MUST generate a welcome message that follows this exact structure and tone:
    - **Title**: "Chào mừng bạn đến với Ezi Languages!" (or English equivalent).
    - **Paragraph 1**: Greet the student by name and give a warm welcome to the platform.
    - **Paragraph 2**: Acknowledge that they are just starting and encourage them to explore the features.
    - **Paragraph 3**: Suggest specific activities they can start with (e.g., pronunciation, listening, quizzes).
    - **Paragraph 4**: A strong, encouraging call to action to start learning.
    - **Paragraph 5**: A friendly closing wish.

3.  **If Performance Data EXISTS:**
    - **Identify Strengths**: Find areas where the student is doing well (high scores, consistency). Start the feedback by highlighting these positive points.
    - **Identify Areas for Improvement**: Find areas where the student is struggling (low scores, specific topics).
    - **Provide Actionable Advice**: For each area of improvement, suggest specific, concrete actions they can take (e.g., "try re-practicing these sentences," "generate a new quiz on 'past tenses'").
    - **Structure the Message**: Begin with praise, then gently introduce areas for improvement with actionable advice, and end with an overall encouraging summary.

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
        language: input.language || 'English',
    });
    return output!;
  }
);
