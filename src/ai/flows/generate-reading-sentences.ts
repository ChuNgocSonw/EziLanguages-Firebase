
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating reading sentences for assignments.
 *
 * It exports:
 * - `generateReadingSentences`: An async function that takes a topic, difficulty, and number of sentences to generate.
 * - `GenerateReadingSentencesInput`: The input type for the function.
 * - `GenerateReadingSentencesOutput`: The output type, which is an array of sentence objects.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ReadingSentence } from '@/lib/types';

const GenerateReadingSentencesInputSchema = z.object({
  topic: z.string().describe('The topic for the reading sentences. This should guide the content of the sentences.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the sentences.'),
  numberOfSentences: z.number().min(1).max(10).describe('The number of sentences to generate.'),
});
export type GenerateReadingSentencesInput = z.infer<typeof GenerateReadingSentencesInputSchema>;

const GenerateReadingSentencesOutputSchema = z.array(z.object({
    unit: z.string().describe("The topic/unit for the sentence. This should match the input topic."),
    text: z.string().describe("The generated sentence for students to read."),
}));
export type GenerateReadingSentencesOutput = z.infer<typeof GenerateReadingSentencesOutputSchema>;


export async function generateReadingSentences(input: GenerateReadingSentencesInput): Promise<GenerateReadingSentencesOutput> {
  return generateReadingSentencesFlow(input);
}


const generateReadingSentencesPrompt = ai.definePrompt({
  name: 'generateReadingSentencesPrompt',
  input: {schema: GenerateReadingSentencesInputSchema },
  output: {schema: GenerateReadingSentencesOutputSchema},
  prompt: `You are an expert language teacher creating content for an assignment.
Your task is to generate exactly {{{numberOfSentences}}} unique English sentences based on the provided topic and difficulty level.

Each sentence object MUST include a 'unit' field, which should be the same as the input 'topic', and a 'text' field containing the sentence.

Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
`,
});

const generateReadingSentencesFlow = ai.defineFlow(
  {
    name: 'generateReadingSentencesFlow',
    inputSchema: GenerateReadingSentencesInputSchema,
    outputSchema: GenerateReadingSentencesOutputSchema,
  },
  async input => {
    const {output} = await generateReadingSentencesPrompt(input);
    return output!;
  }
);
