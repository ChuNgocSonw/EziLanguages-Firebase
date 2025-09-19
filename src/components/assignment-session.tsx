
"use client";

import React from 'react';
import type { Assignment } from '@/lib/types';
import QuizSession from './quiz/quiz-session';
// We will need to create simplified versions of Reading and Listening pages
// that can be embedded or adapted for assignments.
// For now, let's assume they exist.
import ReadingPage from '@/app/(app)/reading/page'; 
import ListeningPage from '@/app/(app)/listening/page'; 

interface AssignmentSessionProps {
  assignment: Assignment;
  onFinish: () => void;
}

export default function AssignmentSession({ assignment, onFinish }: AssignmentSessionProps) {
  switch (assignment.assignmentType) {
    case 'quiz':
      return <QuizSession assignment={assignment} onQuizFinish={onFinish} />;
    case 'reading':
      // This is a simplified approach. Ideally, ReadingPage would be refactored
      // to take assignment content as a prop. For now, we'll just show the page.
      // A proper implementation would require a significant refactor of ReadingPage.
      return <ReadingPage />;
    case 'listening':
      // Similar to ReadingPage, this is a placeholder for a more integrated experience.
      return <ListeningPage />;
    default:
      return (
        <div>
          <p>Unknown assignment type.</p>
          <button onClick={onFinish}>Go Back</button>
        </div>
      );
  }
}
