interface SuggestedQuestionsProps {
  label: string;
  questions: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({ label, questions, onSelect, disabled }: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="border-t border-navy/10 bg-sand-light/60 px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/45">{label}</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question)}
            className="rounded-full border border-adriatic/30 bg-white px-3 py-1.5 text-xs font-medium text-adriatic-dark transition-colors hover:bg-adriatic-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
