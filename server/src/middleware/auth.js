import { getAuth } from '../config/firebase.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.slice(7);

  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
    };
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('Firebase Admin credentials')) {
      res.status(500).json({ error: 'Server Firebase config missing. Restart server after saving server/.env' });
      return;
    }
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
