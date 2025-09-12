
import PageHeader from "@/components/page-header";
import QuizDashboard from "@/components/quiz/quiz-dashboard";

export default function QuizzesPage() {
  return (
    <>
      <PageHeader
        title="Vocabulary & Grammar Quizzes"
        description="Generate a quiz on any topic, or review your past attempts."
      />
      <div className="flex-1 flex flex-col">
        <QuizDashboard />
      </div>
    </>
  );
}
