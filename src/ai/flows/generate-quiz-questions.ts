
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
  prompt: `You are a multilingual quiz generator. Your task is to generate multiple choice questions based on the topic provided by the user.

First, detect the language of the topic: {{{this}}}.

Then, generate 5 multiple choice questions on this topic **in the detected language**. For example, if the topic is in Vietnamese, the entire quiz (questions, options, and answer) must be in Vietnamese. If the topic is in English, the entire quiz must be in English.

Each question should have 4 possible answers, and you must indicate which answer is correct.

Your output must be a JSON array of question objects with the following keys:
- question: the text of the question
- options: an array of 4 strings, representing the possible answers
- answer: the correct answer from the options array
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
