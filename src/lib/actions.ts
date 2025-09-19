
'use server';

import { generateQuizQuestions as generateQuizQuestionsFlow } from "@/ai/flows/generate-quiz-questions";
import { chatWithTutor as chatWithTutorFlow } from "@/ai/flows/chatbot-grammar-correction";
import { analyzePronunciation as analyzePronunciationFlow } from "@/ai/flows/pronunciation-analysis";
import { generateAudio as generateAudioFlow } from "@/ai/flows/text-to-speech";
import { generateFeedback as generateFeedbackFlow } from "@/ai/flows/generate-feedback";
import { generateReadingSentences as generateReadingSentencesFlow } from "@/ai/flows/generate-reading-sentences";
import { generateListeningExercises as generateListeningExercisesFlow } from "@/ai/flows/generate-listening-exercises";


import type { GenerateQuizQuestionsInput, GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import type { ChatWithTutorInput, ChatWithTutorOutput } from "@/ai/flows/chatbot-grammar-correction";
import type { PronunciationAnalysisInput } from "@/ai/flows/pronunciation-analysis";
import type { GenerateFeedbackInput, GenerateFeedbackOutput } from "@/ai/flows/generate-feedback";
import type { PronunciationAttempt } from "@/lib/types";
import type { GenerateReadingSentencesInput, GenerateReadingSentencesOutput } from "@/ai/flows/generate-reading-sentences";
import type { GenerateListeningExercisesInput, GenerateListeningExercisesOutput } from "@/ai/flows/generate-listening-exercises";


export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  // Add any server-side validation or logging here
  return generateQuizQuestionsFlow(input);
}

export async function chatWithTutor(input: ChatWithTutorInput): Promise<ChatWithTutorOutput> {
  // Add any server-side validation or logging here
  const result = await chatWithTutorFlow(input);
  return result;
}

export async function analyzePronunciation(input: PronunciationAnalysisInput): Promise<PronunciationAttempt> {
  return analyzePronunciationFlow(input);
}

export async function generateAudio(text: string) {
    return generateAudioFlow(text);
}

export async function generateFeedback(input: GenerateFeedbackInput): Promise<GenerateFeedbackOutput> {
    // This server action now receives the complete performance data from the client
    // and passes it directly to the Genkit flow for analysis.
    return generateFeedbackFlow(input);
}

export async function generateReadingSentences(input: GenerateReadingSentencesInput): Promise<GenerateReadingSentencesOutput> {
  return generateReadingSentencesFlow(input);
}

export async function generateListeningExercises(input: GenerateListeningExercisesInput): Promise<GenerateListeningExercisesOutput> {
  return generateListeningExercisesFlow(input);
}
