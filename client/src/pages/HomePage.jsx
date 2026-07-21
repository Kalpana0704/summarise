import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Particles from '../components/Particles/Particles';
import VariableProximity from '../components/VariableProximity/VariableProximity';
import { QuizResultsSection } from '../components/QuizResultsSection';
import { ShareQuizButton } from '../components/ShareQuizButton';
import { useAuth } from '../contexts/AuthContext';
import { generateQuiz } from '../lib/api';

export function HomePage() {
  const { user } = useAuth();
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [story, setStory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [shareState, setShareState] = useState({ shareId: null, isShared: false });

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setPdfLoading(true);
    try {
      const { extractTextFromPdf } = await import('../lib/pdf');
      const text = await extractTextFromPdf(file);
      setStory(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (story.trim().length < 50) {
      setError('Please enter at least 50 characters of story text.');
      return;
    }

    setError('');
    setLoading(true);
    setQuiz(null);

    try {
      const result = await generateQuiz(story.trim(), difficulty);
      setQuiz(result);
      setShareState({ shareId: result.shareId ?? null, isShared: result.isShared ?? false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-[calc(100vh-4rem)] w-full bg-black">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <Particles
          particleColors={['#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          className="h-full w-full"
        />
      </div>

      <section className="relative z-10 w-full px-4 pt-20 text-center sm:px-8 md:pt-28 lg:px-12">
        <h1 className="w-full leading-[1.05]">
          <VariableProximity
            label="Turn Stories Into Smart Quizzes"
            className="block w-full text-center text-[clamp(2.25rem,8vw,6.5rem)] font-bold tracking-tight text-white"
            fromFontVariationSettings="'wght' 400, 'opsz' 9"
            toFontVariationSettings="'wght' 1000, 'opsz' 40"
            containerRef={containerRef}
            radius={160}
            falloff="linear"
          />
        </h1>
        <p className="mx-auto mt-10 max-w-2xl text-lg text-gray-300 sm:text-lg">
          Paste a story or upload a PDF — our AI will summarize it and generate an interactive
          multiple-choice quiz. Perfect for students, readers, and educators.
        </p>
      </section>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-10">
      {!user && (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200">
          <Link to="/login" className="font-semibold text-amber-100 underline">
            Sign in
          </Link>{' '}
          to generate quizzes and save your scores.
        </div>
      )}

      <section className="relative z-20 mt-10 overflow-hidden rounded-2xl border border-gray-400 bg-gray-400 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-400 bg-gray-500 px-6 py-4">
          <label className="text-sm font-medium text-gray-900">Your story</label>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePdfUpload}
              disabled={!user || loading || pdfLoading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!user || loading || pdfLoading}
              className="rounded-lg border border-gray-400 bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-500 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pdfLoading ? 'Reading PDF…' : 'Upload PDF'}
            </button>
          </div>
        </div>

        <div className="p-6">
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Paste your story here or upload a PDF (minimum 50 characters)…"
          rows={8}
          disabled={!user || loading}
          className="w-full resize-y rounded-xl border border-gray-400 bg-gray-300 px-4 py-3 text-gray-800 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/40 disabled:bg-gray-200 disabled:opacity-70"
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div>
            <label className="mr-2 text-sm font-medium text-gray-800">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={!user || loading}
              className="rounded-lg border border-gray-400 bg-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-gray-500 focus:outline-none disabled:opacity-70"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!user || loading}
            className="rounded-xl bg-brand-500 px-6 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Summarize & Quiz'}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {loading && (
          <div className="mt-8 flex flex-col items-center gap-3 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-500 border-t-transparent" />
            <p className="text-gray-700">AI is reading your story… (this may take up to a minute)</p>
          </div>
        )}
        </div>
      </section>

      {quiz && (
        <QuizResultsSection
          quiz={quiz}
          shareActions={
            <>
              <ShareQuizButton
                quizId={quiz.id}
                shareId={shareState.shareId ?? quiz.shareId}
                isShared={shareState.isShared ?? quiz.isShared}
                onShareChange={setShareState}
              />
              <Link
                to={`/quiz/${quiz.id}`}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline"
              >
                Open saved quiz page →
              </Link>
            </>
          }
        />
      )}
      </div>
    </div>
  );
}
