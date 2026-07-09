import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QuizPanel } from '../components/QuizPanel';
import { useAuth } from '../contexts/AuthContext';
import { generateQuiz } from '../lib/api';

export function HomePage() {
  const { user } = useAuth();
  const [story, setStory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState(null);

  const handleGenerate = async () => {
    if (story.trim().length < 50) {
      setError('Please enter at least 50 characters of story text.');
      return;
    }

    setError('');
    setLoading(true);
    setQuiz(null);

    try {
      const result = await generateQuiz(story.trim(), difficulty);
      setQuiz(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-brand-700 sm:text-5xl">
          Turn Stories Into Smart Quizzes
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Paste any story and our AI will summarize it and generate an interactive multiple-choice
          quiz. Perfect for students, readers, and educators.
        </p>
      </section>

      {!user && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          <Link to="/login" className="font-semibold underline">
            Sign in
          </Link>{' '}
          to generate quizzes and save your scores.
        </div>
      )}

      <section className="mt-10 rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
        <label className="mb-2 block text-sm font-medium text-gray-700">Your story</label>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Paste your story here (minimum 50 characters)…"
          rows={8}
          disabled={!user || loading}
          className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-50"
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div>
            <label className="mr-2 text-sm font-medium text-gray-700">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={!user || loading}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!user || loading}
            className="rounded-xl bg-brand-500 px-6 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Summarize & Quiz'}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {loading && (
          <div className="mt-8 flex flex-col items-center gap-3 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-gray-600">AI is reading your story…</p>
          </div>
        )}
      </section>

      {quiz && (
        <section className="mt-10 space-y-8">
          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
            <h2 className="mb-3 text-2xl font-bold text-brand-700">Story Summary</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{quiz.summary}</p>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
            <QuizPanel quiz={quiz} />
          </div>
        </section>
      )}
    </div>
  );
}
