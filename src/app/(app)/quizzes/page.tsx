import QuizFlow from "@/components/quiz-flow";
import PageHeader from "@/components/page-header";

export default function QuizzesPage() {
  return (
    <>
      <PageHeader
        title="Vocabulary & Grammar Quizzes"
        description="Generate a quiz on any topic or take one of our pre-made quizzes."
      />
      <div className="flex-1 flex flex-col">
        <QuizFlow />
      </div>
    </>
  );
}
