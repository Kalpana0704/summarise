const difficultyInstructions = {
  easy: 'Use simple vocabulary and straightforward questions about main events.',
  medium: 'Include questions about character motivations and key plot details.',
  hard: 'Include inference, theme, and subtle detail questions.',
};

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];

function buildPrompt(story, difficulty) {
  return `You are an educational assistant. Summarize the story and create exactly 5 multiple-choice questions.

Difficulty: ${difficulty}. ${difficultyInstructions[difficulty]}

Return ONLY valid JSON in this exact shape (no markdown, no extra text):
{
  "summary": "2-4 paragraph summary",
  "questions": [
    {
      "question": "Question text",
      "options": [
        { "letter": "A", "text": "Option A" },
        { "letter": "B", "text": "Option B" },
        { "letter": "C", "text": "Option C" },
        { "letter": "D", "text": "Option D" }
      ],
      "correct": "A"
    }
  ]
}

Story:
${story}`;
}

function parseQuizJson(content) {
  const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed.summary || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('AI response missing required fields');
  }

  return parsed;
}

async function generateWithOpenAICompatible({ baseURL, apiKey, model, story, difficulty, label }) {
  const { default: OpenAI } = await import('openai');

  const client = new OpenAI({ baseURL, apiKey: apiKey || 'ollama' });

  console.log(`Using ${label} model: ${model}`);

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'You create structured summaries and quizzes. Always respond with valid JSON only.',
      },
      { role: 'user', content: buildPrompt(story, difficulty) },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`${label} returned an empty response`);
  }

  return parseQuizJson(content);
}

async function generateWithGroq(story, difficulty) {
  return generateWithOpenAICompatible({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    story,
    difficulty,
    label: 'Groq',
  });
}

async function generateWithOllama(story, difficulty) {
  return generateWithOpenAICompatible({
    baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
    apiKey: 'ollama',
    model: process.env.OLLAMA_MODEL ?? 'llama3.2',
    story,
    difficulty,
    label: 'Ollama',
  });
}

async function callGeminiModel(apiKey, model, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.error?.message ?? 'Gemini API request failed');
    err.isQuota =
      data.error?.message?.includes('quota') || data.error?.status === 'RESOURCE_EXHAUSTED';
    throw err;
  }

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('Gemini returned an empty response');
  }

  return parseQuizJson(content);
}

async function generateWithGemini(story, difficulty) {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = buildPrompt(story, difficulty);

  const preferred = process.env.GEMINI_MODEL;
  const models = preferred
    ? [preferred, ...GEMINI_MODELS.filter((m) => m !== preferred)]
    : GEMINI_MODELS;

  let lastError;

  for (const model of models) {
    try {
      console.log(`Trying Gemini model: ${model}`);
      return await callGeminiModel(apiKey, model, prompt);
    } catch (err) {
      lastError = err;
      if (err.isQuota) {
        console.warn(`Model ${model} quota exceeded, trying next...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new Error('All Gemini models failed');
}

async function generateWithGitHub(story, difficulty) {
  return generateWithOpenAICompatible({
    baseURL: process.env.AI_BASE_URL ?? 'https://models.github.ai/inference',
    apiKey: process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL ?? 'openai/gpt-4o-mini',
    story,
    difficulty,
    label: 'GitHub Models',
  });
}

function getActiveProvider() {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit) return explicit;

  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.OLLAMA_ENABLED === 'true') return 'ollama';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY) return 'github';
  return null;
}

const providers = {
  groq: generateWithGroq,
  ollama: generateWithOllama,
  gemini: generateWithGemini,
  github: generateWithGitHub,
  openai: generateWithGitHub,
};

export async function generateQuizFromStory(story, difficulty = 'medium') {
  const provider = getActiveProvider();

  if (!provider || !providers[provider]) {
    throw new Error(
      'No AI provider configured. Add GROQ_API_KEY (free at console.groq.com) to server/.env',
    );
  }

  try {
    return await providers[provider](story, difficulty);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';

    if (message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error(
        'AI quota exceeded. Try Groq (free): get a key at https://console.groq.com and set GROQ_API_KEY in server/.env',
      );
    }

    if (message.includes('ECONNREFUSED') && provider === 'ollama') {
      throw new Error(
        'Ollama is not running. Install from https://ollama.com, run "ollama pull llama3.2", then "ollama serve"',
      );
    }

    if (message.includes('403') || message.includes('No access to model')) {
      throw new Error(
        'AI access denied for this provider. Try Groq instead: https://console.groq.com',
      );
    }

    throw err;
  }
}
