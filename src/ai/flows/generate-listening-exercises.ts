
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating listening exercises.
 *
 * It exports:
 * - `generateListeningExercises`: An async function that takes a topic, difficulty, and number of exercises to generate.
 * - `GenerateListeningExercisesInput`: The input type for the function.
 * - `GenerateListeningExercisesOutput`: The output type, which is an array of exercise objects.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ListeningExercise } from '@/lib/types';

const GenerateListeningExercisesInputSchema = z.object({
  topic: z.string().describe('The topic for the listening exercises. This should guide the content.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the exercises.'),
  numberOfExercises: z.number().min(1).max(10).describe('The number of exercises to generate.'),
});
export type GenerateListeningExercisesInput = z.infer<typeof GenerateListeningExercisesInputSchema>;


const TypingExerciseSchema = z.object({
    id: z.string().describe("A unique ID for the exercise."),
    type: z.literal('typing').describe("The type of the exercise."),
    text: z.string().describe("The sentence for the student to hear and type."),
});

const McqExerciseSchema = z.object({
    id: z.string().describe("A unique ID for the exercise."),
    type: z.literal('mcq').describe("The type of the exercise."),
    text: z.string().describe("The primary sentence the student will hear."),
    options: z.array(z.string()).length(3).describe("An array of three string options for the multiple-choice question."),
    answer: z.string().describe("The correct answer, which must be one of the provided options."),
});

const GenerateListeningExercisesOutputSchema = z.array(z.union([TypingExerciseSchema, McqExerciseSchema]));
export type GenerateListeningExercisesOutput = z.infer<typeof GenerateListeningExercisesOutputSchema>;


export async function generateListeningExercises(input: GenerateListeningExercisesInput): Promise<GenerateListeningExercisesOutput> {
  return generateListeningExercisesFlow(input);
}


const generateListeningExercisesPrompt = ai.definePrompt({
  name: 'generateListeningExercisesPrompt',
  input: {schema: GenerateListeningExercisesInputSchema },
  output: {schema: GenerateListeningExercisesOutputSchema},
  prompt: `You are an expert language teacher creating content for a listening assignment.
Your task is to generate exactly {{{numberOfExercises}}} unique English listening exercises based on the provided topic and difficulty level.

You MUST generate a mix of 'typing' and 'mcq' (multiple-choice) exercise types.

For each exercise, you MUST generate a unique ID.

**Instructions for each exercise type:**
- **'typing'**:
  - \`type\`: Must be "typing".
  - \`text\`: The full English sentence the student will hear and be asked to type.

- **'mcq'**:
  - \`type\`: Must be "mcq".
  - \`text\`: The primary English sentence the student will hear.
  - \`options\`: An array of exactly 3 string options. One option must be the correct answer (or a very close paraphrase of the \`text\`). The other two options should be plausible but incorrect distractors.
  - \`answer\`: The correct option from the \`options\` array.

Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
`,
});

const generateListeningExercisesFlow = ai.defineFlow(
  {
    name: 'generateListeningExercisesFlow',
    inputSchema: GenerateListeningExercisesInputSchema,
    outputSchema: GenerateListeningExercisesOutputSchema,
  },
  async input => {
    const {output} = await generateListeningExercisesPrompt(input);
    return output!;
  }
);
