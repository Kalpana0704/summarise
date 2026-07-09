const AUTH_ERROR_MESSAGES = {
  'auth/unauthorized-domain':
    'This site URL is not allowed in Firebase. Add your Vercel domain under Firebase Console → Authentication → Settings → Authorized domains.',
  'auth/invalid-api-key':
    'Invalid Firebase API key. Check VITE_FIREBASE_API_KEY in Vercel env vars and redeploy.',
  'auth/operation-not-allowed':
    'Email/password sign-in is disabled in Firebase Console → Authentication → Sign-in method.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
  'auth/popup-blocked-by-browser':
    'Popup was blocked. Allow popups for this site or try email sign-in.',
};

export function getAuthErrorMessage(error) {
  if (error && typeof error === 'object' && 'code' in error) {
    return AUTH_ERROR_MESSAGES[error.code] ?? error.message ?? 'Authentication failed';
  }
  if (error instanceof Error) return error.message;
  return 'Authentication failed';
}
