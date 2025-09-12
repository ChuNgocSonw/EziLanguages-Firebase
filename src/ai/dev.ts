import { config } from 'dotenv';
config();

import '@/ai/flows/generate-quiz-questions.ts';
import '@/ai/flows/chatbot-grammar-correction.ts';
import '@/ai/flows/pronunciation-analysis.ts';
import '@/ai/flows/text-to-speech.ts';
