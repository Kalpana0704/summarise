# Story Quiz – AI Summarizer & Quiz Generator

Full-stack web app that turns any story into an AI-generated summary and a 5-question multiple-choice quiz. Paste text or upload a PDF, choose a difficulty, and take the quiz with instant feedback.

**Architecture:** React SPA (Vite) → Express REST API → Firestore (Admin SDK only). Firebase Auth handles login; the browser never talks to Firestore directly.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Pages & Routes](#pages--routes)
- [API Endpoints](#api-endpoints)
- [Firestore Data Model](#firestore-data-model)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [License](#license)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6 |
| Backend | Node.js 18+, Express 4, Helmet, CORS, Zod |
| Auth | Firebase Authentication (Email/Password + Google) |
| Database | Cloud Firestore (server-side only via Firebase Admin SDK) |
| AI | Groq · Google Gemini · Ollama · GitHub Models API |
| Client libraries | `pdfjs-dist`, `canvas-confetti`, `motion`, `ogl` |

---

## Features

### Story input & generation
- Paste story text (min 50 characters) or **upload a PDF** (client-side extraction via PDF.js)
- PDF limits: max 10 MB, first 25 pages, text capped at 15,000 characters
- Difficulty: **easy**, **medium**, **hard** (affects AI prompt only)
- AI returns a 2–4 paragraph summary + exactly **5 MCQs** with 4 options each
- Rate-limited generation (default: 20 requests/hour per IP)

### Quiz experience
- All questions shown at once with instant answer feedback
- Progress bar, score tracking, reset button
- Confetti animation on a perfect score
- Score saved to Firestore when quiz is completed (except on shared/public quizzes)

### User account & profile
- Sign up / sign in with email+password or Google
- Profile page: quizzes taken, completed count, average score, quiz history
- Header avatar dropdown (email shown on click, not always visible)

### Quiz sharing
- Enable/disable a public share link for any owned quiz
- Shared URL: `/share/:shareId` — no login required, scores not saved
- Copy link to clipboard from quiz page or home results

### UI
- **Home:** dark background, WebGL particle effect, variable-proximity hero text
- **Profile:** grey-themed dashboard
- **Header:** sticky grey nav bar across all pages
- Collapsible summary section with copy-to-clipboard on home results

> **Note:** Sign-in is required to generate quizzes or upload PDFs. Browsing shared quizzes works without an account.

---

## Project Structure

```
summarise1/
├── client/                         # React frontend (Vite)
│   ├── public/
│   │   └── logo.jpg
│   ├── src/
│   │   ├── App.jsx                 # Router + page backgrounds
│   │   ├── main.jsx                # Entry point + ErrorBoundary
│   │   ├── index.css               # Tailwind directives
│   │   ├── components/
│   │   │   ├── Header.jsx          # Nav, avatar dropdown, logout
│   │   │   ├── ProtectedRoute.jsx  # Auth guard for /profile, /quiz/:id
│   │   │   ├── QuizPanel.jsx       # MCQ UI, scoring, confetti
│   │   │   ├── QuizResultsSection.jsx  # Summary + quiz after generation
│   │   │   ├── ShareQuizButton.jsx # Enable/copy/stop sharing
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── Particles/          # WebGL particle background (OGL)
│   │   │   └── VariableProximity/  # Mouse-proximity hero text (Motion)
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # Firebase auth state + login/logout
│   │   ├── lib/
│   │   │   ├── api.js              # REST client (authFetch + public fetch)
│   │   │   ├── firebase.js         # Firebase client SDK init
│   │   │   ├── authErrors.js       # Firebase error code → user message
│   │   │   └── pdf.js              # PDF text extraction (pdfjs-dist)
│   │   └── pages/
│   │       ├── HomePage.jsx        # Story input, generate, inline results
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── ProfilePage.jsx     # Stats + quiz history
│   │       ├── QuizPage.jsx        # Saved quiz view + retake
│   │       └── SharedQuizPage.jsx  # Public shared quiz
│   ├── vite.config.js              # Dev server + /api proxy (120s timeout)
│   ├── tailwind.config.js          # Brand purple palette
│   ├── vercel.json                 # SPA rewrites for Vercel
│   └── .env.example
│
├── server/                         # Express REST API
│   ├── src/
│   │   ├── index.js                # App entry, CORS, route mounting
│   │   ├── config/
│   │   │   └── firebase.js         # Firebase Admin SDK init
│   │   ├── middleware/
│   │   │   ├── auth.js             # Bearer token verification
│   │   │   └── errorHandler.js     # Global error handler
│   │   ├── routes/
│   │   │   ├── quizzes.js          # Generate, list, score, share
│   │   │   └── users.js            # Profile + stats
│   │   └── services/
│   │       └── ai.js               # Multi-provider AI generation
│   ├── scripts/
│   │   └── smoke-api.mjs           # API smoke test
│   └── .env.example
│
├── firestore.rules                 # Deny all client access
├── firestore.indexes.json          # Composite index for quiz listing
├── firebase.json                   # Firestore config (asia-south1)
├── .firebaserc                     # Firebase project ID
├── render.yaml                     # Render deployment for API
├── package.json                    # Root scripts (run both apps)
└── README.md
```

---

## How It Works

### Authentication
1. User signs in via Firebase client SDK (email/password or Google popup).
2. React stores auth state in `AuthContext` via `onAuthStateChanged`.
3. Every API call sends `Authorization: Bearer <Firebase ID token>`.
4. Express `requireAuth` middleware verifies the token with Firebase Admin SDK.
5. First call to `GET /api/users/me` auto-creates a `users/{uid}` document.

### Quiz generation flow
1. User pastes story or uploads PDF on HomePage (must be signed in).
2. Client calls `POST /api/quizzes/generate` with `{ text, difficulty }`.
3. Server picks an AI provider, generates summary + 5 questions, validates with Zod.
4. Quiz saved to Firestore with a UUID `shareId` (`isShared: false` initially).
5. Results shown inline on home page via `QuizResultsSection`.

### Taking a quiz
1. User selects an answer → instant reveal (correct/incorrect).
2. When all 5 are answered, score is computed locally.
3. If `saveScore` is enabled, client calls `PATCH /api/quizzes/:id/score`.
4. Confetti fires on a perfect score.

### AI provider selection (`server/src/services/ai.js`)
1. If `AI_PROVIDER` is set → use that provider (`groq`, `ollama`, `gemini`, `github`).
2. Otherwise auto-detect in order: **Groq** → **Ollama** → **Gemini** → **GitHub Models**.
3. Gemini tries multiple models if quota is exceeded.

### Security model
- Firestore rules **deny all client read/write** — all DB access goes through the API.
- AI API keys and Firebase Admin credentials stay server-side only.
- Quiz ownership enforced on every protected quiz route (`userId === req.user.uid`).

---

## Prerequisites

- **Node.js 18+**
- **Firebase project** — [console.firebase.google.com](https://console.firebase.google.com)
- **At least one AI provider** — [Groq](https://console.groq.com) recommended (free tier)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd summarise1
npm install
npm run install:all
```

### 2. Firebase

1. Create a Firebase project.
2. Enable **Authentication** → Email/Password + Google sign-in.
3. Create a **Cloud Firestore** database.
4. Register a **Web app** → copy config to `client/.env`.
5. **Project Settings → Service Accounts** → Generate new private key → copy to `server/.env`.
6. Deploy Firestore rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 3. Configure environment

Copy the example files and fill in values:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

See [Environment Variables](#environment-variables) below for the full list.

**Minimum server config to get started:**

```env
PORT=5000
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your-groq-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Run locally

From the repo root (starts API + frontend together):

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:5000 |
| Health check | http://localhost:5000/health |

In dev, `VITE_API_URL` should be **empty** — Vite proxies `/api` to port 5000 with a 120s timeout for slow AI responses.

Or run separately:

```bash
npm run dev:server   # API only
npm run dev:client   # Frontend only
```

### 5. Smoke test (optional)

With both `.env` files configured and the server running:

```bash
npm run smoke --prefix server
```

---

## Environment Variables

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | |
| `VITE_FIREBASE_PROJECT_ID` | Yes | |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | |
| `VITE_FIREBASE_APP_ID` | Yes | |
| `VITE_API_URL` | Prod only | Production API URL. Leave empty in dev. |

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default `5000` |
| `CLIENT_URL` | Prod | Frontend origin for CORS (e.g. `https://your-app.vercel.app`) |
| `FIREBASE_PROJECT_ID` | Yes | Firebase Admin SDK |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Service account private key |
| `AI_PROVIDER` | No | Force provider: `groq` · `ollama` · `gemini` · `github` |
| `GROQ_API_KEY` | One AI | Groq API key ([console.groq.com](https://console.groq.com)) |
| `GROQ_MODEL` | No | Default `llama-3.3-70b-versatile` |
| `OLLAMA_ENABLED` | One AI | Set `true` for local Ollama |
| `OLLAMA_BASE_URL` | No | Default `http://localhost:11434/v1` |
| `OLLAMA_MODEL` | No | Default `llama3.2` |
| `GEMINI_API_KEY` | One AI | Google Gemini API key |
| `GEMINI_MODEL` | No | Default tries `gemini-2.5-flash`, `gemini-2.0-flash`, … |
| `GITHUB_TOKEN` | One AI | GitHub Models API token |
| `AI_BASE_URL` | No | Default `https://models.github.ai/inference` |
| `AI_MODEL` | No | Default `openai/gpt-4o-mini` |
| `RATE_LIMIT_MAX` | No | Quiz generations per hour (default `20`) |

---

## Pages & Routes

| Route | Auth | Page | Description |
|-------|------|------|-------------|
| `/` | Optional | HomePage | Story input, PDF upload, generate quiz, inline results |
| `/login` | No | LoginPage | Email/password + Google sign-in |
| `/register` | No | RegisterPage | Create account |
| `/profile` | **Yes** | ProfilePage | Stats, quiz history |
| `/quiz/:id` | **Yes** | QuizPage | Saved quiz — summary, share, retake |
| `/share/:shareId` | No | SharedQuizPage | Public quiz (no score saving) |
| `*` | — | — | Redirects to `/` |

---

## API Endpoints

Base URL: `http://localhost:5000` (dev) or your Render URL (prod).

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/health` | No | Health check |
| `GET` | `/` | No | Redirects to `CLIENT_URL` |
| `GET` | `/api/users/me` | Yes | Profile + computed stats |
| `POST` | `/api/quizzes/generate` | Yes | Generate summary + quiz (rate limited) |
| `GET` | `/api/quizzes` | Yes | List user's quizzes (newest 50) |
| `GET` | `/api/quizzes/:id` | Yes | Get owned quiz |
| `PATCH` | `/api/quizzes/:id/score` | Yes | Save score + `completedAt` |
| `POST` | `/api/quizzes/:id/share` | Yes | Enable public sharing |
| `DELETE` | `/api/quizzes/:id/share` | Yes | Disable public sharing |
| `GET` | `/api/quizzes/share/:shareId` | No | Fetch public shared quiz |

**Auth header:** `Authorization: Bearer <Firebase ID token>`

---

## Firestore Data Model

All access is via Express + Admin SDK. Client SDK cannot read or write Firestore.

### `users/{uid}`

```json
{
  "email": "user@example.com",
  "displayName": null,
  "createdAt": "Timestamp",
  "quizzesTaken": 0
}
```

Stats (`quizzesTaken`, `quizzesCompleted`, `averageScore`) are computed live from the `quizzes` collection on each profile request.

### `quizzes/{id}`

```json
{
  "userId": "firebase-uid",
  "title": "Quiz – 7/21/2026",
  "storyPreview": "First 120 chars of story…",
  "difficulty": "medium",
  "summary": "AI-generated summary text",
  "questions": [
    {
      "question": "Question text?",
      "options": [
        { "letter": "A", "text": "Option A" },
        { "letter": "B", "text": "Option B" },
        { "letter": "C", "text": "Option C" },
        { "letter": "D", "text": "Option D" }
      ],
      "correct": "B"
    }
  ],
  "score": null,
  "totalQuestions": 5,
  "shareId": "uuid-v4",
  "isShared": false,
  "createdAt": "Timestamp",
  "completedAt": null
}
```

### Required Firestore index

Composite index on `quizzes`: `userId ASC`, `createdAt DESC` (defined in `firestore.indexes.json`).

---

## Scripts

| Command | Location | Description |
|---------|----------|-------------|
| `npm run dev` | Root | Start API + client concurrently |
| `npm run dev:server` | Root | API only |
| `npm run dev:client` | Root | Frontend only |
| `npm run install:all` | Root | Install deps in `server/` and `client/` |
| `npm run build` | Root | Build client → `client/dist/` |
| `npm run dev` | `server/` | Start API with `.env` |
| `npm run dev:watch` | `server/` | API with file watch |
| `npm run start` | `server/` | Production API start |
| `npm run smoke` | `server/` | Smoke-test API endpoints |
| `npm run dev` | `client/` | Vite dev server on :5173 |
| `npm run build` | `client/` | Production build |
| `npm run preview` | `client/` | Preview production build |

---

## Deployment

Recommended stack: **Vercel** (frontend) + **Render** (API) + **Firebase** (auth + database).

### Frontend — Vercel

1. Connect repo, set root directory to `client/`.
2. Build command: `npm run build` · Output: `dist/`.
3. Set all `VITE_FIREBASE_*` env vars.
4. Set `VITE_API_URL` to your Render API URL (e.g. `https://story-quiz-api.onrender.com`).
5. `client/vercel.json` handles SPA routing.

### Backend — Render

Configured via `render.yaml`:
- Service: `story-quiz-api`
- Root: `server/`
- Build: `npm install` · Start: `npm start`

Set in Render dashboard:
- All Firebase Admin env vars
- At least one AI provider key
- `CLIENT_URL` = your Vercel frontend URL

CORS automatically allows all `*.vercel.app` origins plus `CLIENT_URL`.

### Firebase

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Also add your production domain to **Firebase Auth → Authorized domains**.

### Production checklist

- [ ] Firestore rules and indexes deployed
- [ ] Firebase Auth: Email/Password + Google enabled
- [ ] Firebase Auth authorized domains include production URL
- [ ] `VITE_API_URL` set on Vercel
- [ ] `CLIENT_URL` set on Render
- [ ] AI provider key configured on Render
- [ ] Firebase Admin credentials set on Render

---

## License

MIT
