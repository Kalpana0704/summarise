import confetti from 'canvas-confetti';
import { useState } from 'react';
import { saveQuizScore } from '../lib/api';

export function QuizPanel({ quiz, onScoreSaved, saveScore = true, theme = 'default', interactive = false }) {
  const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(null));
  const [revealed, setRevealed] = useState(Array(quiz.questions.length).fill(false));
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLight = theme === 'light';
  const answeredCount = revealed.filter(Boolean).length;
  const progress = (answeredCount / quiz.questions.length) * 100;
  const firstUnanswered = revealed.findIndex((r) => !r);

  const canVisit = (index) => {
    if (completed) return true;
    if (revealed[index]) return true;
    if (firstUnanswered === -1) return true;
    return index === firstUnanswered;
  };

  const goToQuestion = (index) => {
    if (canVisit(index)) setCurrentIndex(index);
  };

  const goPrevious = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    setCurrentIndex((i) => {
      const next = i + 1;
      if (next < quiz.questions.length && canVisit(next)) return next;
      return i;
    });
  };

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
    } else if (interactive && qIndex < quiz.questions.length - 1) {
      setTimeout(() => setCurrentIndex(qIndex + 1), 450);
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
    setCurrentIndex(0);
  };

  const visibleQuestions = interactive
    ? quiz.questions.map((q, qIndex) => ({ q, qIndex })).filter(({ qIndex }) => qIndex === currentIndex)
    : quiz.questions.map((q, qIndex) => ({ q, qIndex }));

  const titleCls = isLight ? 'text-gray-800' : 'text-brand-700';
  const scoreBadgeCls = isLight
    ? 'bg-gray-300 text-gray-800'
    : 'bg-brand-50 text-brand-700';
  const cardCls = isLight
    ? 'rounded-2xl border border-gray-400 bg-gray-200 p-5 shadow-sm transition hover:shadow-md'
    : 'rounded-2xl border border-brand-100 bg-white p-5 shadow-sm';
  const resetBtnCls = isLight
    ? 'rounded-lg border border-gray-400 px-3 py-1 text-sm text-gray-700 transition hover:scale-105 hover:bg-gray-300 active:scale-95'
    : 'rounded-lg border border-brand-500 px-3 py-1 text-sm text-brand-600 transition hover:scale-105 hover:bg-brand-50 active:scale-95';
  const progressBarCls = isLight
    ? 'h-full rounded-full bg-gradient-to-r from-gray-500 to-gray-600 transition-all duration-500 ease-out'
    : 'h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500 ease-out';
  const optionDefaultCls = isLight
    ? 'border-gray-300 bg-gray-100 text-gray-800 hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-200 hover:shadow-md'
    : 'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50 hover:shadow-md';
  const optionSelectedCls = isLight ? 'border-gray-500 bg-gray-300 text-gray-900' : 'border-brand-500 bg-brand-50';
  const letterCls = isLight ? 'font-bold text-gray-600' : 'font-bold text-brand-500';
  const progressLabelCls = isLight ? 'text-gray-600' : 'text-gray-500';
  const progressTrackCls = isLight ? 'h-2.5 overflow-hidden rounded-full bg-gray-300' : 'h-2.5 overflow-hidden rounded-full bg-gray-300';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-2xl font-bold ${titleCls}`}>Quiz Time</h2>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-4 py-1 text-sm font-semibold ${scoreBadgeCls}`}>
            Score: {score}/{quiz.totalQuestions}
          </span>
          <button
            type="button"
            onClick={reset}
            className={resetBtnCls}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className={`flex items-center justify-between text-xs font-medium ${progressLabelCls}`}>
          <span>Progress</span>
          <span>
            {answeredCount}/{quiz.questions.length} answered
          </span>
        </div>
        <div className={progressTrackCls}>
          <div
            className={progressBarCls}
            style={{ width: `${completed ? 100 : progress}%` }}
          />
        </div>
      </div>

      {interactive && (
        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((_, i) => {
            const done = revealed[i];
            const active = i === currentIndex;
            const correct = done && answers[i] === quiz.questions[i].correct;
            let dotCls = 'border-gray-300 bg-white text-gray-600 hover:border-brand-400';

            if (active) dotCls = 'border-brand-500 bg-brand-500 text-white scale-110';
            else if (done && correct) dotCls = 'border-green-500 bg-green-100 text-green-700';
            else if (done) dotCls = 'border-red-400 bg-red-50 text-red-600';

            return (
              <button
                key={i}
                type="button"
                onClick={() => goToQuestion(i)}
                disabled={!canVisit(i)}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition ${dotCls} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      )}

      {visibleQuestions.map(({ q, qIndex }) => (
        <div key={qIndex} className={cardCls}>
          <h3 className={`mb-3 font-semibold ${isLight ? 'text-gray-900' : 'text-brand-900'}`}>
            {qIndex + 1}. {q.question}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((opt) => {
              const selected = answers[qIndex] === opt.letter;
              const showResult = revealed[qIndex];
              const isCorrect = opt.letter === q.correct;
              let cls = optionDefaultCls;

              if (showResult && isCorrect) cls = 'border-green-500 bg-green-50 scale-[1.02]';
              else if (showResult && selected && !isCorrect) cls = 'border-red-400 bg-red-50';
              else if (selected) cls = optionSelectedCls;

              return (
                <button
                  key={`${qIndex}-${opt.letter}`}
                  type="button"
                  disabled={revealed[qIndex] || completed}
                  onClick={() => handleSelect(qIndex, opt.letter, q)}
                  className={`rounded-xl border p-3 text-left transition-all duration-200 ${cls} disabled:cursor-default disabled:transform-none`}
                >
                  <span className={letterCls}>{opt.letter})</span> {opt.text}
                </button>
              );
            })}
          </div>
          {revealed[qIndex] && (
            <p
              className={`mt-3 text-sm font-medium ${answers[qIndex] === q.correct ? 'text-green-600' : 'text-red-600'}`}
            >
              {answers[qIndex] === q.correct
                ? '✓ Correct!'
                : `✗ Incorrect. The answer is ${q.correct}.`}
            </p>
          )}

        </div>
      ))}

      {interactive && !completed && (
        <div className="flex justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={goPrevious}
            disabled={currentIndex === 0}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="self-center text-sm text-gray-500">
            Question {currentIndex + 1} of {quiz.questions.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex >= quiz.questions.length - 1 || !canVisit(currentIndex + 1)}
            className="rounded-lg border border-brand-500 bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {completed && (
        <div className={`rounded-2xl p-6 text-center text-white shadow-lg ${isLight ? 'bg-gradient-to-r from-gray-500 to-gray-600' : 'bg-gradient-to-r from-brand-500 to-brand-700'}`}>
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
