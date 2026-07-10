import { auth } from './firebase';

// Empty in dev → relative /api paths (Vite proxies to localhost:5000).
// Set in production (Vercel): https://story-quiz-api.onrender.com
const API_BASE = import.meta.env.VITE_API_URL ?? '';

function apiUrl(path) {
  if (!API_BASE && import.meta.env.PROD) {
    throw new Error(
      'API URL is not configured. Set VITE_API_URL=https://story-quiz-api.onrender.com in Vercel env vars and redeploy.',
    );
  }
  return `${API_BASE.replace(/\/$/, '')}${path}`;
}

async function authFetch(path, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();

  let response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'Failed to fetch' || err instanceof TypeError) {
      throw new Error(
        import.meta.env.DEV
          ? 'Cannot reach the API server. Make sure the backend is running on port 5000 (npm run dev in server/).'
          : 'Cannot reach the API server. Check VITE_API_URL on Vercel, add your domain in Render CLIENT_URL, and wait ~30s for Render free tier to wake up.',
      );
    }
    throw err;
  }

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

function publicApiUrl(path) {
  if (!API_BASE && import.meta.env.PROD) {
    throw new Error('API URL is not configured.');
  }
  return `${API_BASE.replace(/\/$/, '')}${path}`;
}

export async function fetchSharedQuiz(shareId) {
  let response;
  try {
    response = await fetch(publicApiUrl(`/api/quizzes/share/${shareId}`));
  } catch {
    throw new Error(
      import.meta.env.DEV
        ? 'Cannot reach the API server. Make sure the backend is running on port 5000.'
        : 'Cannot reach the API server.',
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? 'Shared quiz not found');
  }
  return data.quiz;
}

export async function enableQuizShare(id) {
  return authFetch(`/api/quizzes/${id}/share`, { method: 'POST' });
}

export async function disableQuizShare(id) {
  return authFetch(`/api/quizzes/${id}/share`, { method: 'DELETE' });
}
