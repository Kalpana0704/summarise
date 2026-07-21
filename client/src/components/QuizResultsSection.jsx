import { useState } from 'react';
import { QuizPanel } from './QuizPanel';

export function QuizResultsSection({ quiz, shareActions }) {
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(quiz.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-gray-400 bg-gray-400 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-400 bg-gray-500 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Your results</p>
          <h2 className="text-lg font-bold text-gray-900">{quiz.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">{shareActions}</div>
      </div>

      <div className="space-y-4 p-6">
        <div className="rounded-xl border border-gray-400 bg-gray-300 shadow-sm transition hover:shadow-md">
          <button
            type="button"
            onClick={() => setSummaryOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          >
            <span className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-sm text-gray-700">
                📖
              </span>
              Story Summary
            </span>
            <span className="text-sm font-medium text-gray-600">
              {summaryOpen ? 'Hide ▲' : 'Show ▼'}
            </span>
          </button>

          {summaryOpen && (
            <div className="border-t border-gray-400 px-5 pb-5 pt-4">
              <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{quiz.summary}</p>
              <button
                type="button"
                onClick={handleCopySummary}
                className="mt-4 rounded-lg border border-gray-400 bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-500 hover:bg-gray-300"
              >
                {copied ? 'Copied!' : 'Copy summary'}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-400 bg-gray-300 p-5 shadow-sm">
          <QuizPanel quiz={quiz} theme="light" />
        </div>
      </div>
    </section>
  );
}
