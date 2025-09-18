
'use server';

import { generateQuizQuestions as generateQuizQuestionsFlow } from "@/ai/flows/generate-quiz-questions";
import { chatWithTutor as chatWithTutorFlow } from "@/ai/flows/chatbot-grammar-correction";
import { analyzePronunciation as analyzePronunciationFlow } from "@/ai/flows/pronunciation-analysis";
import { generateAudio as generateAudioFlow } from "@/ai/flows/text-to-speech";
import { generateFeedback as generateFeedbackFlow } from "@/ai/flows/generate-feedback";

import type { GenerateQuizQuestionsInput, GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import type { ChatWithTutorInput, ChatWithTutorOutput } from "@/ai/flows/chatbot-grammar-correction";
import type { PronunciationAnalysisInput } from "@/ai/flows/pronunciation-analysis";
import type { GenerateFeedbackOutput } from "@/ai/flows/generate-feedback";
import type { PronunciationAttempt, UserProfile, QuizAttempt } from "@/lib/types";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";


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

async function getStudentPerformanceData(studentId: string) {
    const userDocRef = doc(db, "users", studentId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        throw new Error("Student not found");
    }

    const userProfile = userDoc.data() as UserProfile;

    const quizHistoryRef = collection(db, "users", studentId, "quizHistory");
    const quizHistoryQuery = query(quizHistoryRef, orderBy("completedAt", "desc"));
    const quizHistorySnapshot = await getDocs(quizHistoryQuery);
    const quizHistory = quizHistorySnapshot.docs.map(doc => doc.data() as QuizAttempt);
    
    const assignmentHistoryRef = collection(db, "users", studentId, "assignmentAttempts");
    const assignmentHistoryQuery = query(assignmentHistoryRef, orderBy("completedAt", "desc"));
    const assignmentHistorySnapshot = await getDocs(assignmentHistoryQuery);
    const assignmentHistory = assignmentHistorySnapshot.docs.map(doc => doc.data() as QuizAttempt);

    return {
        studentName: userProfile.name,
        performanceData: {
            pronunciationScores: userProfile.pronunciationScores,
            listeningScores: userProfile.listeningScores,
            quizHistory: quizHistory,
            assignmentHistory: assignmentHistory,
        }
    };
}


export async function generateFeedback(studentId: string): Promise<GenerateFeedbackOutput> {
    const data = await getStudentPerformanceData(studentId);
    return generateFeedbackFlow({
        studentName: data.studentName,
        performanceData: data.performanceData,
    });
}
