'use server';

/**
 * @fileOverview Implements a Genkit flow for a language tutor chatbot.
 *
 * - chatWithTutor - A function that corrects grammar and answers vocabulary questions.
 * - ChatWithTutorInput - The input type for the chatWithTutor function.
 * - ChatWithTutorOutput - The return type for the chatWithTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithTutorInputSchema = z.object({
  text: z.string().describe('The user input text.'),
});
export type ChatWithTutorInput = z.infer<typeof ChatWithTutorInputSchema>;

const ChatWithTutorOutputSchema = z.object({
  response: z.string().describe('The AI tutor\'s response. This could be a corrected sentence or an answer to a question.'),
  explanation: z.string().describe('An explanation of the grammar corrections, vocabulary, or the answer provided.'),
  isCorrection: z.boolean().describe('Set to true if the response is primarily a grammar correction of a conversational sentence. Set to false if it is a direct answer to a question.'),
});
export type ChatWithTutorOutput = z.infer<typeof ChatWithTutorOutputSchema>;

export async function chatWithTutor(input: ChatWithTutorInput): Promise<ChatWithTutorOutput> {
  return chatWithTutorFlow(input);
}

const chatWithTutorPrompt = ai.definePrompt({
  name: 'chatWithTutorPrompt',
  input: {schema: ChatWithTutorInputSchema},
  output: {schema: ChatWithTutorOutputSchema},
  prompt: `You are an AI language tutor. Your role is to help users practice a language.

There are two modes of interaction:

1.  **Grammar Correction**: If the user's input is a conversational sentence, your primary job is to correct any grammatical errors.
    - Provide the corrected sentence in the 'response' field.
    - Provide a concise explanation of the corrections in the 'explanation' field.
    - Set 'isCorrection' to true.

2.  **Vocabulary/Grammar Questions**: If the user asks a direct question (e.g., "What does 'eloquent' mean?", "How do I use 'in spite of'?"), your job is to answer it directly.
    - Provide the answer in the 'response' field.
    - Provide a clear, helpful explanation or definition in the 'explanation' field.
    - Set 'isCorrection' to false.

Analyze the user's input and respond in the appropriate mode.

Input Text: {{{text}}}
`,
});

const chatWithTutorFlow = ai.defineFlow(
  {
    name: 'chatWithTutorFlow',
    inputSchema: ChatWithTutorInputSchema,
    outputSchema: ChatWithTutorOutputSchema,
  },
  async input => {
    const {output} = await chatWithTutorPrompt(input);
    return output!;
  }
);
