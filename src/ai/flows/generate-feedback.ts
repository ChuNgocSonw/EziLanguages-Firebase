'use server';
/**
 * @fileOverview A Genkit flow for generating student feedback based on keywords.
 *
 * - generateFeedback - A function that takes keywords and generates a constructive feedback message.
 * - GenerateFeedbackInput - The input type for the generateFeedback function.
 * - GenerateFeedbackOutput - The return type for the generateFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFeedbackInputSchema = z.object({
  keywords: z.string().describe('A comma-separated list of keywords or short phrases summarizing the feedback points. For example: "good on idioms, needs work on past tense, remember to practice speaking".'),
  studentName: z.string().describe("The name of the student receiving the feedback."),
});
export type GenerateFeedbackInput = z.infer<typeof GenerateFeedbackInputSchema>;

const GenerateFeedbackOutputSchema = z.object({
  feedbackText: z.string().describe('The fully generated, well-structured, and encouraging feedback message.'),
});
export type GenerateFeedbackOutput = z.infer<typeof GenerateFeedbackOutputSchema>;


export async function generateFeedback(input: GenerateFeedbackInput): Promise<GenerateFeedbackOutput> {
  return generateFeedbackFlow(input);
}


const generateFeedbackPrompt = ai.definePrompt({
  name: 'generateFeedbackPrompt',
  input: { schema: GenerateFeedbackInputSchema },
  output: { schema: GenerateFeedbackOutputSchema },
  prompt: `You are an AI assistant for a language teacher. Your task is to compose a constructive and encouraging feedback message for a student based on the teacher's keywords.

Guidelines:
- Start with a friendly greeting addressing the student by name.
- Structure the feedback clearly. Start with positive points first, then move to areas for improvement.
- Elaborate on the provided keywords in a natural and helpful way.
- Maintain a supportive and motivating tone throughout the message.
- Keep the message concise and easy to understand.
- End with an encouraging closing statement.

Student's Name: {{{studentName}}}
Teacher's Keywords: {{{keywords}}}
`,
});

const generateFeedbackFlow = ai.defineFlow(
  {
    name: 'generateFeedbackFlow',
    inputSchema: GenerateFeedbackInputSchema,
    outputSchema: GenerateFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await generateFeedbackPrompt(input);
    return output!;
  }
);
