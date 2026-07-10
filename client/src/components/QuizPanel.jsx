import confetti from 'canvas-confetti';
import { useState } from 'react';
import { saveQuizScore } from '../lib/api';

export function QuizPanel({ quiz, onScoreSaved, saveScore = true }) {
  const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(null));
  const [revealed, setRevealed] = useState(Array(quiz.questions.length).fill(false));
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSelect = (qIndex, letter, question) => {
    if (completed || revealed[qIndex]) return;

    const isCorrect = letter === question.correct;
    const nextRevealed = [...revealed];
    nextRevealed[qIndex] = true;
    setRevealed(nextRevealed);

    const nextAnswers = [...answers];
    nextAnswers[qIndex] = letter;
    setAnswers(nextAnswers);

    const newScore = score + (isCorrect ? 1 : 0);
    setScore(newScore);

    if (nextRevealed.every(Boolean)) {
      finishQuiz(newScore);
    }
  };

  const finishQuiz = async (finalScore) => {
    setCompleted(true);
    setSaving(true);

    if (finalScore === quiz.totalQuestions) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    }

    if (saveScore && quiz.id) {
      try {
        await saveQuizScore(quiz.id, finalScore);
        onScoreSaved?.(finalScore);
      } catch {
        // Score display still works locally
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(false);
    }
  };

  const reset = () => {
    setAnswers(Array(quiz.questions.length).fill(null));
    setRevealed(Array(quiz.questions.length).fill(false));
    setCompleted(false);
    setScore(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-brand-700">Quiz Time</h2>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-brand-50 px-4 py-1 font-semibold text-brand-700">
            Score: {score}/{quiz.totalQuestions}
          </span>
          <button
            onClick={reset}
            className="rounded-lg border border-brand-500 px-3 py-1 text-sm text-brand-500 hover:bg-brand-50"
          >
            Reset
          </button>
        </div>
      </div>

      {quiz.questions.map((q, qIndex) => (
        <div key={qIndex} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-brand-900">
            {qIndex + 1}. {q.question}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((opt) => {
              const selected = answers[qIndex] === opt.letter;
              const showResult = revealed[qIndex];
              const isCorrect = opt.letter === q.correct;
              let cls = 'border-gray-200 hover:border-brand-500 hover:bg-brand-50';

              if (showResult && isCorrect) cls = 'border-green-500 bg-green-50';
              else if (showResult && selected && !isCorrect) cls = 'border-red-400 bg-red-50';
              else if (selected) cls = 'border-brand-500 bg-brand-50';

              return (
                <button
                  key={opt.letter}
                  disabled={revealed[qIndex] || completed}
                  onClick={() => handleSelect(qIndex, opt.letter, q)}
                  className={`rounded-xl border p-3 text-left transition ${cls} disabled:cursor-default`}
                >
                  <span className="font-bold text-brand-500">{opt.letter})</span> {opt.text}
                </button>
              );
            })}
          </div>
          {revealed[qIndex] && (
            <p className={`mt-2 text-sm ${answers[qIndex] === q.correct ? 'text-green-600' : 'text-red-600'}`}>
              {answers[qIndex] === q.correct
                ? 'Correct!'
                : `Incorrect. The answer is ${q.correct}.`}
            </p>
          )}
        </div>
      ))}

      {completed && (
        <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 p-6 text-center text-white">
          <h3 className="text-xl font-bold">Quiz Complete!</h3>
          <p className="mt-2 text-lg">
            Final score: {score}/{quiz.totalQuestions}
          </p>
          <p className="mt-1 text-sm opacity-90">
            {score === quiz.totalQuestions
              ? 'Perfect! You mastered this story.'
              : score >= quiz.totalQuestions * 0.8
                ? 'Excellent work!'
                : score >= quiz.totalQuestions * 0.6
                  ? 'Good job — keep reading!'
                  : 'Review the summary and try again.'}
          </p>
          {saving && saveScore && <p className="mt-2 text-xs opacity-75">Saving score…</p>}
          {completed && !saveScore && (
            <p className="mt-2 text-xs opacity-75">Scores are not saved on shared quizzes.</p>
          )}
        </div>
      )}
    </div>
  );
}
