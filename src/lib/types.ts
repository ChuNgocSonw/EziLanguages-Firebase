export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface UserProfile {
  name: string;
  xp: number;
  streak: number;
  badges: string[];
}
