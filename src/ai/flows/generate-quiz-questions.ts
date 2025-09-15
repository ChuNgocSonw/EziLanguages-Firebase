
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating multiple choice quiz questions on a specified topic and difficulty.
 *
 * It exports:
 * - `generateQuizQuestions`: An async function that takes a topic and difficulty as input and returns an array of quiz questions.
 * - `GenerateQuizQuestionsInput`: The input type for the `generateQuizQuestions` function.
 * - `GenerateQuizQuestionsOutput`: The output type for the `generateQuizQuestions` function, which is an array of quiz question objects.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the quiz.'),
  numberOfQuestions: z.number().min(1).max(50).describe('The number of questions to generate.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GenerateQuizQuestionsOutputSchema = z.array(
  z.object({
    question: z.string().describe('The quiz question.'),
    options: z.array(z.string()).describe('The possible answer options.'),
    answer: z.string().describe('The correct answer to the question.'),
  })
);
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const generateQuizQuestionsPrompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are a quiz generator.
Your ONLY task is to create {{{numberOfQuestions}}} multiple-choice questions about the following topic, at the specified difficulty level.
The questions and answers MUST be in the same language as the topic.
Each question MUST have 4 answer options.

Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
`,
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async input => {
    const {output} = await generateQuizQuestionsPrompt(input);
    return output!;
  }
);
