
"use client";

import React from 'react';
import type { Assignment } from '@/lib/types';
import QuizSession from './quiz/quiz-session';
import { ReadingAssignmentSession } from '@/app/(app)/reading/page'; 
import { ListeningAssignmentSession } from '@/app/(app)/listening/page'; 

interface AssignmentSessionProps {
  assignment: Assignment;
  onFinish: () => void;
}

export default function AssignmentSession({ assignment, onFinish }: AssignmentSessionProps) {
  switch (assignment.assignmentType) {
    case 'quiz':
      return <QuizSession assignment={assignment} onQuizFinish={onFinish} />;
    case 'reading':
      return <ReadingAssignmentSession assignment={assignment} onFinish={onFinish} />;
    case 'listening':
      return <ListeningAssignmentSession assignment={assignment} onFinish={onFinish} />;
    default:
      return (
        <div>
          <p>Unknown assignment type.</p>
          <button onClick={onFinish}>Go Back</button>
        </div>
      );
  }
}
