"use server";

import { generateQuizQuestions as generateQuizQuestionsFlow } from "@/ai/flows/generate-quiz-questions";
import { correctGrammar as correctGrammarFlow } from "@/ai/flows/chatbot-grammar-correction";
import type { GenerateQuizQuestionsInput, GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import type { CorrectGrammarInput, CorrectGrammarOutput } from "@/ai/flows/chatbot-grammar-correction";

export async function generateQuizQuestions(topic: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  // Add any server-side validation or logging here
  return generateQuizQuestionsFlow(topic);
}

export async function correctGrammar(input: CorrectGrammarInput): Promise<CorrectGrammarOutput> {
  // Add any server-side validation or logging here
  return correctGrammarFlow(input);
}
