
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating multiple choice quiz questions on a specified topic.
 *
 * It exports:
 * - `generateQuizQuestions`: An async function that takes a topic as input and returns an array of quiz questions.
 * - `GenerateQuizQuestionsInput`: The input type for the `generateQuizQuestions` function, which is a string representing the topic.
 * - `GenerateQuizQuestionsOutput`: The output type for the `generateQuizQuestions` function, which is an array of quiz question objects.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizQuestionsInputSchema = z.string().describe('The topic to generate quiz questions for.');
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GenerateQuizQuestionsOutputSchema = z.array(
  z.object({
    question: z.string().describe('The quiz question.'),
    options: z.array(z.string()).describe('The possible answer options.'),
    answer: z.string().describe('The correct answer to the question.'),
  })
);
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(topic: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(topic);
}

const generateQuizQuestionsPrompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are an expert quiz generator. Your primary task is to create a quiz based *directly* on the topic provided by the user.

Topic: {{{this}}}

Instructions:
1.  Analyze the provided topic to understand its language and subject matter.
2.  Generate 5 multiple-choice questions that are **strictly about this topic**.
3.  The entire quiz (questions, options, and the answer) must be in the same language as the topic. For example, if the topic is in Vietnamese, the quiz must be in Vietnamese.
4.  Each question must have 4 possible answer options.
5.  You must specify the correct answer for each question.
`,
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async topic => {
    const {output} = await generateQuizQuestionsPrompt(topic);
    return output!;
  }
);
