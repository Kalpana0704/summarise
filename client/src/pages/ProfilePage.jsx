import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProfile, fetchQuizzes } from '../lib/api';

export function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchProfile(), fetchQuizzes()])
      .then(([p, q]) => {
        setProfile(p);
        setQuizzes(q);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-red-600">{error}</p>
        <p className="mt-2 text-sm text-gray-500">
          Make sure Firebase and the API server are configured correctly.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-brand-700">My Profile</h1>
      <p className="mt-1 text-gray-600">{profile?.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Quizzes taken" value={profile?.quizzesTaken ?? 0} />
        <StatCard label="Completed" value={profile?.quizzesCompleted ?? 0} />
        <StatCard label="Average score" value={`${profile?.averageScore ?? 0}/5`} />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-700">Quiz history</h2>
          <Link to="/" className="text-sm font-medium text-brand-500 hover:underline">
            Create new quiz →
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-10 text-center text-gray-500">
            No quizzes yet. Paste a story on the home page to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                to={`/quiz/${quiz.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-brand-900">{quiz.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(quiz.createdAt).toLocaleString()} · {quiz.difficulty}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{quiz.storyPreview}</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                      quiz.score !== null
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {quiz.score !== null ? `${quiz.score}/${quiz.totalQuestions}` : 'Not taken'}
                  </span>
                  <span className="text-brand-500">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-700">{value}</p>
    </div>
  );
}
