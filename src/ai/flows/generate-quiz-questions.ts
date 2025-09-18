
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating quiz questions on a specified topic and difficulty,
 * supporting multiple question formats.
 *
 * It exports:
 * - `generateQuizQuestions`: An async function that takes a topic, difficulty, and question type as input and returns an array of quiz questions.
 * - `GenerateQuizQuestionsInput`: The input type for the `generateQuizQuestions` function.
 * - `GenerateQuizQuestionsOutput`: The output type for the `generateQuizQuestions` function, which is an array of quiz question objects.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { QuizQuestionSchema } from '@/lib/types';

const GenerateQuizQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz. This could be a general topic like "English Idioms" or it could be the specific content of a lesson that questions should be based on.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the quiz.'),
  numberOfQuestions: z.number().min(1).max(30).describe('The number of questions to generate.'),
  questionType: z.enum(['multiple-choice', 'true-false', 'fill-in-the-blank']).describe('The desired format for the generated questions.'),
  language: z.enum(['English', 'Vietnamese']).optional().default('English').describe('The language for the quiz questions and answers.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GenerateQuizQuestionsOutputSchema = z.array(QuizQuestionSchema);
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const generateQuizQuestionsPrompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are a quiz generator for language learners.
Your ONLY task is to create {{{numberOfQuestions}}} questions about the following topic, at the specified difficulty level, and in the specified format.

**Language Rules:**
{{#if (eq language "Vietnamese")}}
You MUST generate questions **in Vietnamese** that are designed to teach **English vocabulary, grammar, or concepts** to a Vietnamese speaker. The questions and answers themselves must be written in Vietnamese, but the subject matter must be about learning English. For example, if the topic is "English Idioms", you should create questions in Vietnamese that test the user's knowledge of those English idioms.
{{else}}
The questions and answers MUST be in English.
{{/if}}

IMPORTANT: If the provided topic contains a list of sentences or specific content, you MUST base your questions exclusively on that content. Do not introduce outside knowledge. If it's a general topic, you can use your general knowledge.

Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
Question Type: {{{questionType}}}

Instructions for each question type:
- 'multiple-choice': Each question MUST have 4 answer options. The 'options' field must be an array of 4 strings. The 'type' must be 'multiple-choice'.
- 'true-false': Each question is a statement. The 'options' field must be an empty array. The 'answer' must be either "True" or "False" (or the equivalent in the specified language). The 'type' must be 'true-false'.
- 'fill-in-the-blank': Each question should contain a blank, often represented by "____". The 'options' field must be an empty array. The 'answer' is the word or phrase that correctly fills the blank. The 'type' must be 'fill-in-the-blank'.
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
