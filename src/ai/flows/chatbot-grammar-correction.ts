'use server';

/**
 * @fileOverview Implements a Genkit flow for a language tutor chatbot.
 *
 * - chatWithTutor - A function that corrects grammar, answers vocabulary questions, and performs translations.
 * - ChatWithTutorInput - The input type for the chatWithTutor function.
 * - ChatWithTutorOutput - The return type for the chatWithTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithTutorInputSchema = z.object({
  text: z.string().describe('The user input text.'),
  language: z.string().optional().describe("The language for the explanation. Can be 'English' or 'Vietnamese'."),
});
export type ChatWithTutorInput = z.infer<typeof ChatWithTutorInputSchema>;

const ChatWithTutorOutputSchema = z.object({
  response: z.string().describe('The AI tutor\'s response. This could be a corrected sentence, an answer to a question, or a translation.'),
  explanation: z.string().describe('An explanation of the grammar corrections, vocabulary, the answer provided, or confirmation of the translation.'),
  isCorrection: z.boolean().describe('Set to true if the response is primarily a grammar correction of a conversational sentence.'),
  isTranslation: z.boolean().describe('Set to true if the response is a translation of the user\'s text.'),
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

There are three modes of interaction:

1.  **Grammar Correction**: If the user's input is a conversational sentence, your primary job is to correct any grammatical errors.
    - Provide the corrected sentence in the 'response' field.
    - Provide a concise explanation of the corrections in the 'explanation' field.
    - Set 'isCorrection' to true and 'isTranslation' to false.

2.  **Vocabulary/Grammar Questions**: If the user asks a direct question (e.g., "What does 'eloquent' mean?", "How do I use 'in spite of'?"), your job is to answer it directly.
    - Provide the answer in the 'response' field.
    - Provide a clear, helpful explanation or definition in the 'explanation' field.
    - Set 'isCorrection' to false and 'isTranslation' to false.

3.  **Translation**: If the user asks for a translation (e.g., "Translate 'I want to buy some bread' to Japanese", "How do you say 'good morning' in Vietnamese?"), your job is to provide the translation.
    - Provide the translated text in the 'response' field.
    - In the 'explanation' field, confirm the translation (e.g., "Translated from English to Japanese.").
    - Set 'isCorrection' to false and 'isTranslation' to true.

Analyze the user's input and respond in the appropriate mode.

IMPORTANT: The user has specified that the explanation should be in the following language: {{{language}}}. All text in the 'explanation' field MUST be in this language. The text in the 'response' field should remain in the language of the original correction, answer, or translation.

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
    const {output} = await chatWithTutorPrompt({
        ...input,
        language: input.language || 'English', // Default to English if not provided
    });
    return output!;
  }
);
