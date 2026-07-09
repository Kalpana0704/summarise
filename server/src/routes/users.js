import { Router } from 'express';
import { getFirestore } from '../config/firebase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        email: req.user.email ?? null,
        displayName: req.user.email?.split('@')[0] ?? 'User',
        createdAt: new Date(),
        quizzesTaken: 0,
      });
    }

    const statsSnap = await db
      .collection('quizzes')
      .where('userId', '==', req.user.uid)
      .get();

    const quizzes = statsSnap.docs.map((d) => d.data());
    const completed = quizzes.filter((q) => q.score !== null);
    const averageScore =
      completed.length > 0
        ? completed.reduce((sum, q) => sum + (q.score ?? 0), 0) / completed.length
        : 0;

    const profile = (await userRef.get()).data();

    res.json({
      user: {
        uid: req.user.uid,
        email: req.user.email,
        displayName: profile?.displayName,
        quizzesTaken: quizzes.length,
        quizzesCompleted: completed.length,
        averageScore: Math.round(averageScore * 10) / 10,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
