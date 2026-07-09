import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function authFetch(path, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  return data;
}

export async function generateQuiz(text, difficulty, title) {
  const data = await authFetch('/api/quizzes/generate', {
    method: 'POST',
    body: JSON.stringify({ text, difficulty, title }),
  });
  return data.quiz;
}

export async function fetchQuizzes() {
  const data = await authFetch('/api/quizzes');
  return data.quizzes;
}

export async function fetchQuiz(id) {
  const data = await authFetch(`/api/quizzes/${id}`);
  return data.quiz;
}

export async function saveQuizScore(id, score) {
  return authFetch(`/api/quizzes/${id}/score`, {
    method: 'PATCH',
    body: JSON.stringify({ score }),
  });
}

export async function fetchProfile() {
  const data = await authFetch('/api/users/me');
  return data.user;
}
