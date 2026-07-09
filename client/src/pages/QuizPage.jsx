import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QuizPanel } from '../components/QuizPanel';
import { fetchQuiz } from '../lib/api';

export function QuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retakeKey, setRetakeKey] = useState(0);
  const [latestScore, setLatestScore] = useState(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError('');
    setQuiz(null);
    setLatestScore(null);

    fetchQuiz(id)
      .then((data) => {
        setQuiz(data);
        setLatestScore(data.score);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load quiz'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleScoreSaved = (score) => {
    setLatestScore(score);
    setQuiz((prev) => (prev ? { ...prev, score, completedAt: new Date().toISOString() } : prev));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-red-600">{error || 'Quiz not found'}</p>
        <Link to="/profile" className="mt-4 inline-block text-sm font-medium text-brand-500 hover:underline">
          ← Back to profile
        </Link>
      </div>
    );
  }

  const displayScore = latestScore ?? quiz.score;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/profile" className="text-sm font-medium text-brand-500 hover:underline">
          ← Back to profile
        </Link>
        <Link to="/" className="text-sm font-medium text-gray-600 hover:text-brand-500">
          Create new quiz
        </Link>
      </div>

      <header className="rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-brand-700">{quiz.title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          {new Date(quiz.createdAt).toLocaleString()} ·{' '}
          <span className="capitalize">{quiz.difficulty}</span>
        </p>
        {quiz.storyPreview && (
          <p className="mt-3 text-sm italic text-gray-600">"{quiz.storyPreview}"</p>
        )}
        {displayScore !== null && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              Best score: {displayScore}/{quiz.totalQuestions}
            </span>
            {quiz.completedAt && (
              <span className="text-xs text-gray-500">
                Last completed {new Date(quiz.completedAt).toLocaleString()}
              </span>
            )}
            <button
              type="button"
              onClick={() => setRetakeKey((k) => k + 1)}
              className="rounded-lg border border-brand-500 px-3 py-1 text-sm font-medium text-brand-500 hover:bg-brand-50"
            >
              Retake quiz
            </button>
          </div>
        )}
      </header>

      <section className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
        <h2 className="mb-3 text-2xl font-bold text-brand-700">Story Summary</h2>
        <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{quiz.summary}</p>
      </section>

      <section className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
        <QuizPanel key={retakeKey} quiz={quiz} onScoreSaved={handleScoreSaved} />
      </section>
    </div>
  );
}
