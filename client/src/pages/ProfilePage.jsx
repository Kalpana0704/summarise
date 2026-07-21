import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchProfile, fetchQuizzes } from '../lib/api';

function getInitials(email) {
  if (!email) return '?';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function difficultyStyle(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'hard':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-amber-100 text-amber-700 border-amber-300';
  }
}

export function ProfilePage() {
  const { user } = useAuth();
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" />
        <p className="text-sm font-medium text-gray-600">Loading your profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <span className="text-3xl">⚠️</span>
          <p className="mt-3 font-medium text-red-700">{error}</p>
          <p className="mt-2 text-sm text-red-600/80">
            Make sure Firebase and the API server are configured correctly.
          </p>
        </div>
      </div>
    );
  }

  const email = profile?.email ?? user?.email ?? '';
  const completionRate =
    profile?.quizzesTaken > 0
      ? Math.round((profile.quizzesCompleted / profile.quizzesTaken) * 100)
      : 0;

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="overflow-hidden rounded-2xl border border-gray-400 bg-gray-400 shadow-lg">
        <div className="border-b border-gray-500 bg-gray-500 px-6 py-8 sm:px-8">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-gray-400 bg-gray-300 text-2xl font-bold text-gray-800 shadow-md">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(email)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                My Profile
              </p>
              <h1 className="mt-1 truncate text-2xl font-bold text-gray-900 sm:text-3xl">
                {email.split('@')[0]}
              </h1>
              <p className="mt-1 truncate text-sm text-gray-700">{email}</p>
            </div>
            <Link
              to="/"
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md"
            >
              + New Quiz
            </Link>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3">
          <StatCard
            icon="📝"
            label="Quizzes taken"
            value={profile?.quizzesTaken ?? 0}
            accent="from-gray-500 to-gray-600"
          />
          <StatCard
            icon="✅"
            label="Completed"
            value={profile?.quizzesCompleted ?? 0}
            subtext={`${completionRate}% completion rate`}
            accent="from-green-500 to-green-600"
          />
          <StatCard
            icon="⭐"
            label="Average score"
            value={`${profile?.averageScore ?? 0}/5`}
            accent="from-brand-500 to-brand-700"
          />
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-gray-400 bg-gray-400 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-400 bg-gray-500 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Quiz History</h2>
            <p className="text-sm text-gray-700">
              {quizzes.length === 0
                ? 'No quizzes yet'
                : `${quizzes.length} quiz${quizzes.length === 1 ? '' : 'zes'} saved`}
            </p>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-gray-400 bg-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-gray-500 hover:bg-gray-200"
          >
            Create new quiz →
          </Link>
        </div>

        <div className="p-6">
          {quizzes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-500 bg-gray-300 px-6 py-14 text-center">
              <span className="text-4xl">📚</span>
              <p className="mt-4 font-medium text-gray-800">No quizzes yet</p>
              <p className="mt-1 text-sm text-gray-600">
                Paste a story on the home page to get started.
              </p>
              <Link
                to="/"
                className="mt-5 inline-block rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Go to Home
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  to={`/quiz/${quiz.id}`}
                  className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-400 bg-gray-300 p-4 shadow-sm transition hover:border-gray-500 hover:bg-gray-200 hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 transition group-hover:text-brand-700">
                        {quiz.title}
                      </p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${difficultyStyle(quiz.difficulty)}`}
                      >
                        {quiz.difficulty}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      {new Date(quiz.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-700">{quiz.storyPreview}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1.5 text-sm font-bold ${
                        quiz.score !== null
                          ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                          : 'bg-gray-200 text-gray-600 ring-1 ring-gray-400'
                      }`}
                    >
                      {quiz.score !== null ? `${quiz.score}/${quiz.totalQuestions}` : 'Not taken'}
                    </span>
                    <span className="text-lg text-gray-500 transition group-hover:translate-x-0.5 group-hover:text-brand-500">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, accent }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-400 bg-gray-300 p-5 shadow-sm">
      <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br ${accent} opacity-10`} />
      <div className="relative">
        <span className="text-2xl">{icon}</span>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-600">{label}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        {subtext && <p className="mt-1 text-xs text-gray-600">{subtext}</p>}
      </div>
    </div>
  );
}
