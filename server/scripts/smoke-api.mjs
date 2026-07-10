import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientEnv = fs.readFileSync(path.join(__dirname, '../../client/.env'), 'utf8');
const apiKey = clientEnv.match(/VITE_FIREBASE_API_KEY=(.+)/)?.[1]?.trim();

if (!apiKey) {
  console.error('Missing VITE_FIREBASE_API_KEY in client/.env');
  process.exit(1);
}

const { getAuth } = await import('../src/config/firebase.js');
const auth = getAuth();
const customToken = await auth.createCustomToken('smoke-test-user');

const signInRes = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  },
);

const signInData = await signInRes.json();
if (!signInData.idToken) {
  console.error('Sign-in failed:', signInData);
  process.exit(1);
}

const base = process.env.API_BASE ?? 'http://127.0.0.1:5000';

for (const path of ['/api/users/me', '/api/quizzes']) {
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${signInData.idToken}` },
  });
  const text = await res.text();
  console.log(path, res.status, text.slice(0, 120));
}

const health = await fetch(`${base}/health`);
console.log('/health', health.status, await health.text());
