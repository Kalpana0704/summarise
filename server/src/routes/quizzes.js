import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getFirestore } from '../config/firebase.js';
import { requireAuth } from '../middleware/auth.js';
import { generateQuizFromStory } from '../services/ai.js';

const router = Router();

const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 20,
  message: { error: 'Too many quiz generations. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generateSchema = z.object({
  text: z.string().min(50, 'Story must be at least 50 characters').max(15000),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  title: z.string().max(120).optional(),
});

const scoreSchema = z.object({
  score: z.number().int().min(0).max(5),
});

function toQuizDoc(id, data) {
  return {
    id,
    userId: data.userId,
    title: data.title,
    storyPreview: data.storyPreview,
    difficulty: data.difficulty,
    summary: data.summary,
    questions: data.questions,
    score: data.score ?? null,
    totalQuestions: data.totalQuestions ?? data.questions?.length ?? 5,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt,
    completedAt: data.completedAt?.toDate?.()?.toISOString?.() ?? data.completedAt ?? null,
  };
}

router.post('/generate', generateLimiter, requireAuth, async (req, res, next) => {
  try {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' });
      return;
    }

    const { text, difficulty, title } = parsed.data;
    const generated = await generateQuizFromStory(text, difficulty);

    const db = getFirestore();
    const docRef = await db.collection('quizzes').add({
      userId: req.user.uid,
      title: title ?? `Quiz – ${new Date().toLocaleDateString()}`,
      storyPreview: text.slice(0, 120) + (text.length > 120 ? '…' : ''),
      difficulty,
      summary: generated.summary,
      questions: generated.questions,
      score: null,
      totalQuestions: generated.questions.length,
      createdAt: new Date(),
      completedAt: null,
    });

    res.status(201).json({
      quiz: toQuizDoc(docRef.id, {
        userId: req.user.uid,
        title: title ?? `Quiz – ${new Date().toLocaleDateString()}`,
        storyPreview: text.slice(0, 120) + (text.length > 120 ? '…' : ''),
        difficulty,
        summary: generated.summary,
        questions: generated.questions,
        score: null,
        totalQuestions: generated.questions.length,
        createdAt: new Date(),
        completedAt: null,
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const snapshot = await getFirestore()
      .collection('quizzes')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const quizzes = snapshot.docs.map((doc) => toQuizDoc(doc.id, doc.data()));
    res.json({ quizzes });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const doc = await getFirestore().collection('quizzes').doc(req.params.id).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }

    const data = doc.data();
    if (data.userId !== req.user.uid) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ quiz: toQuizDoc(doc.id, data) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/score', requireAuth, async (req, res, next) => {
  try {
    const parsed = scoreSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid score' });
      return;
    }

    const ref = getFirestore().collection('quizzes').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }

    const data = doc.data();
    if (data.userId !== req.user.uid) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await ref.update({
      score: parsed.data.score,
      completedAt: new Date(),
    });

    res.json({ success: true, score: parsed.data.score });
  } catch (err) {
    next(err);
  }
});

export default router;
