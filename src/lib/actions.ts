
'use server';

import { generateQuizQuestions as generateQuizQuestionsFlow } from "@/ai/flows/generate-quiz-questions";
import { chatWithTutor as chatWithTutorFlow } from "@/ai/flows/chatbot-grammar-correction";
import { analyzePronunciation as analyzePronunciationFlow } from "@/ai/flows/pronunciation-analysis";
import { generateAudio as generateAudioFlow } from "@/ai/flows/text-to-speech";

import type { GenerateQuizQuestionsInput, GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import type { ChatWithTutorInput, ChatWithTutorOutput } from "@/ai/flows/chatbot-grammar-correction";
import type { PronunciationAnalysisInput } from "@/ai/flows/pronunciation-analysis";
import type { PronunciationAttempt } from "@/lib/types";


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


