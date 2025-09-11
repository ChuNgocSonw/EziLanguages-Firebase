'use server';

import { generateQuizQuestions as generateQuizQuestionsFlow } from "@/ai/flows/generate-quiz-questions";
import { chatWithTutor as chatWithTutorFlow } from "@/ai/flows/chatbot-grammar-correction";
import type { GenerateQuizQuestionsInput, GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import type { ChatWithTutorInput, ChatWithTutorOutput } from "@/ai/flows/chatbot-grammar-correction";

export async function generateQuizQuestions(topic: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  // Add any server-side validation or logging here
  return generateQuizQuestionsFlow(topic);
}

export async function chatWithTutor(input: ChatWithTutorInput): Promise<ChatWithTutorOutput> {
  // Add any server-side validation or logging here
  const result = await chatWithTutorFlow(input);
  // Ensure default values for new fields if the model doesn't return them
  return {
    isTranslation: false,
    ...result,
  };
}
