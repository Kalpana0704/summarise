import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_PAGES = 25;
const MAX_CHARS = 15000;

export async function extractTextFromPdf(file) {
  if (file.type !== 'application/pdf') {
    throw new Error('Please upload a PDF file.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('PDF must be 10 MB or smaller.');
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const pageCount = Math.min(pdf.numPages, MAX_PAGES);
  const parts = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) parts.push(pageText);
  }

  let text = parts.join('\n\n').trim();

  if (pdf.numPages > MAX_PAGES) {
    text += `\n\n[Only the first ${MAX_PAGES} pages were imported.]`;
  }

  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
  }

  if (text.length < 50) {
    throw new Error(
      'Could not extract enough text from this PDF. Try a text-based PDF or paste the story manually.',
    );
  }

  return text;
}
