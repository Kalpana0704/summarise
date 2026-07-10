import { useState } from 'react';
import { enableQuizShare, disableQuizShare } from '../lib/api';

export function ShareQuizButton({ quizId, shareId, isShared, onShareChange }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const getShareUrl = (id) => `${window.location.origin}/share/${id}`;

  const handleShare = async () => {
    setError('');
    setLoading(true);
    try {
      let id = shareId;
      if (!isShared || !id) {
        const result = await enableQuizShare(quizId);
        id = result.shareId;
        onShareChange?.({ shareId: id, isShared: true });
      }
      await navigator.clipboard.writeText(getShareUrl(id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSharing = async () => {
    setError('');
    setLoading(true);
    try {
      await disableQuizShare(quizId);
      onShareChange?.({ isShared: false });
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop sharing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        className="rounded-lg border border-brand-500 px-3 py-1 text-sm font-medium text-brand-500 hover:bg-brand-50 disabled:opacity-60"
      >
        {loading ? '…' : copied ? 'Link copied!' : isShared ? 'Copy share link' : 'Share quiz'}
      </button>
      {isShared && (
        <button
          type="button"
          onClick={handleStopSharing}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
        >
          Stop sharing
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
