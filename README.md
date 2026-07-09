# Story Quiz – AI Summarizer & Quiz Generator

Full-stack interview-ready project that turns any story into an AI summary and interactive multiple-choice quiz.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, JavaScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, JavaScript |
| Auth | Firebase Authentication (Email + Google) |
| Database | Cloud Firestore |
| AI | GitHub Models API (OpenAI-compatible) |

## Features

- Paste a story → AI generates summary + 5 MCQ questions
- Difficulty levels: easy, medium, hard
- Interactive quiz with instant feedback and confetti on perfect score
- Scores saved to Firestore via REST API
- User profile with quiz history and average score stats
- Rate limiting on quiz generation
- Protected routes with Firebase ID token verification

## Project Structure

```
├── client/          React frontend (Vite)
├── server/          Express REST API
├── firestore.rules  Firestore security rules
└── firestore.indexes.json
```

## Prerequisites

- Node.js 18+
- Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- GitHub token with Models API access (or OpenAI API key)

## Setup

### 1. Firebase

1. Create a Firebase project
2. Enable **Authentication** → Email/Password + Google
3. Create a **Firestore** database
4. Register a **Web app** and copy config to `client/.env`
5. Go to **Project Settings → Service Accounts** → Generate private key → copy values to `server/.env`
6. Deploy rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

### 2. Server

```bash
cd server
cp .env.example .env
# Fill in .env values
npm install
npm run dev
```

API runs at `http://localhost:5000`

### 3. Client

```bash
cd client
cp .env.example .env
# Fill in Firebase web config
npm install
npm run dev
```

App runs at `http://localhost:5173`

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/api/users/me` | Yes | User profile + stats |
| POST | `/api/quizzes/generate` | Yes | Generate summary + quiz |
| GET | `/api/quizzes` | Yes | List user's quizzes |
| GET | `/api/quizzes/:id` | Yes | Get single quiz |
| PATCH | `/api/quizzes/:id/score` | Yes | Save quiz score |

## Deployment

- **Frontend:** Firebase Hosting, Vercel, or Netlify (`npm run build` in `client/`)
- **Backend:** Render, Railway, or Fly.io (`npm run build && npm start` in `server/`)
- Set `CLIENT_URL` on server and `VITE_API_URL` on client to production API URL

## Interview Talking Points

- **Separation of concerns:** React SPA ↔ Express REST API ↔ Firestore
- **Security:** Firebase Admin verifies tokens; Firestore rules deny direct client writes; API keys stay server-side
- **AI integration:** Structured JSON prompts with validation via Zod
- **UX:** Loading states, error handling, score persistence, difficulty selection
- **Scalability:** Rate limiting, indexed Firestore queries, plain JavaScript throughout

## License

MIT
