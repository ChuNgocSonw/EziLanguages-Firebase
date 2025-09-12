'use server';

/**
 * @fileOverview Implements a Genkit flow for analyzing pronunciation.
 *
 * - analyzePronunciation - A function that takes an audio data URI and a reference text,
 *   transcribes the audio, compares it to the text, and provides a score and word-by-word feedback.
 * - PronunciationAnalysisInput - The input type for the analyzePronunciation function.
 * - PronunciationAnalysisOutput - The return type for the analyzePronunciation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const PronunciationAnalysisInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The user's spoken audio, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:audio/webm;base64,<encoded_data>'."
    ),
  referenceText: z.string().describe('The original text the user was supposed to read.'),
});
export type PronunciationAnalysisInput = z.infer<typeof PronunciationAnalysisInputSchema>;


const PronunciationAnalysisOutputSchema = z.object({
    transcribedText: z.string().describe("The text transcribed from the user's audio."),
    score: z.number().describe('The pronunciation accuracy score as a percentage (0-100).'),
    words: z.array(z.object({
        word: z.string().describe('A word from the original reference text.'),
        correct: z.boolean().describe('True if the user pronounced the word correctly, false otherwise.'),
    })).describe('An array providing feedback for each word in the original reference text.'),
});
export type PronunciationAnalysisOutput = z.infer<typeof PronunciationAnalysisOutputSchema>;


export async function analyzePronunciation(input: PronunciationAnalysisInput): Promise<PronunciationAnalysisOutput> {
  return pronunciationAnalysisFlow(input);
}


const sttModel = googleAI.model('gemini-2.5-flash-stt');
const analysisModel = googleAI.model('gemini-2.5-flash');

const pronunciationAnalysisFlow = ai.defineFlow(
  {
    name: 'pronunciationAnalysisFlow',
    inputSchema: PronunciationAnalysisInputSchema,
    outputSchema: PronunciationAnalysisOutputSchema,
  },
  async ({ audioDataUri, referenceText }) => {
    // 1. Speech-to-Text Transcription
    const { output: transcribedText } = await ai.generate({
        model: sttModel,
        prompt: [{ media: { url: audioDataUri } }],
    });

    if (!transcribedText) {
        throw new Error("Could not transcribe audio.");
    }
    
    // 2. Analysis and Scoring
    const analysisPrompt = ai.definePrompt({
        name: 'pronunciationScoringPrompt',
        output: { schema: PronunciationAnalysisOutputSchema },
        prompt: `You are a pronunciation evaluation expert. Compare the "Original Text" with the "User's Pronunciation (Transcribed Text)".

        Your task is to:
        1.  Determine which words from the "Original Text" were pronounced correctly by the user. A word is correct if it appears in the transcribed text in the correct relative order. Be lenient with minor transcription errors.
        2.  Calculate an overall accuracy score as a percentage based on the number of correctly pronounced words.
        3.  Provide a word-by-word analysis. For every word in the "Original Text", indicate if it was pronounced correctly.
        4.  Return the original transcribed text as well.

        Original Text: "${referenceText}"
        User's Pronunciation (Transcribed Text): "${transcribedText}"
        `,
    });

    const { output: analysisResult } = await analysisPrompt();
    
    if (!analysisResult) {
        throw new Error("Could not analyze pronunciation.");
    }

    // Ensure the output contains the transcribed text from the STT model
    return {
        ...analysisResult,
        transcribedText: transcribedText,
    };
  }
);
