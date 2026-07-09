export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err instanceof SyntaxError) {
    res.status(502).json({ error: 'Failed to parse AI response' });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  const status = err.statusCode ?? err.status ?? 500;
  res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
}
