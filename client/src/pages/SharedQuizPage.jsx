import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QuizPanel } from '../components/QuizPanel';
import { useAuth } from '../contexts/AuthContext';
import { fetchSharedQuiz } from '../lib/api';

export function SharedQuizPage() {
  const { shareId } = useParams();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shareId) return;

    setLoading(true);
    setError('');
    fetchSharedQuiz(shareId)
      .then(setQuiz)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load quiz'))
      .finally(() => setLoading(false));
  }, [shareId]);

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
        <p className="text-red-600">{error || 'Shared quiz not found'}</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-500 hover:underline">
          ← Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900">
        Shared quiz — anyone with this link can read the summary and take the quiz.
        {!user && (
          <>
            {' '}
            <Link to="/login" className="font-semibold underline">
              Sign in
            </Link>{' '}
            to save quizzes to your profile.
          </>
        )}
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
      </header>

      <section className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
        <h2 className="mb-3 text-2xl font-bold text-brand-700">Story Summary</h2>
        <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{quiz.summary}</p>
      </section>

      <section className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
        <QuizPanel quiz={quiz} saveScore={false} />
      </section>
    </div>
  );
}
