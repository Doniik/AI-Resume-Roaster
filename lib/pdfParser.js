import { PDFParse } from 'pdf-parse';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_TEXT_LENGTH = 50; // minimum characters to consider "useful text"

export class PdfParseError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'PdfParseError';
    this.code = code;
  }
}

/**
 * Validates the raw uploaded buffer before we attempt to parse it.
 * Throws PdfParseError with a user-friendly message on any failure.
 */
export function validatePdfBuffer(buffer, originalFilename) {
  if (!buffer || buffer.length === 0) {
    throw new PdfParseError('The uploaded file is empty.', 'EMPTY_FILE');
  }
  if (buffer.length > MAX_FILE_SIZE) {
    throw new PdfParseError('The file is larger than the 10MB limit.', 'FILE_TOO_LARGE');
  }

  const safeFilename = typeof originalFilename === 'string' ? originalFilename : '';
  if (!safeFilename.toLowerCase().endsWith('.pdf')) {
    throw new PdfParseError('Only PDF files are allowed.', 'INVALID_FILE_TYPE');
  }

  // Real PDFs can have a small amount of leading data before the signature.
  // Search within the first 1024 bytes rather than requiring it at byte 0.
  const searchWindow = buffer.slice(0, 1024).toString('latin1');
  if (!searchWindow.includes('%PDF-')) {
    throw new PdfParseError('This file does not appear to be a valid PDF.', 'CORRUPT_FILE');
  }
}

/**
 * Extracts text from a validated PDF buffer using pdf-parse.
 * Rejects PDFs where no useful text can be extracted (e.g. scanned images)
 * instead of silently returning empty/fake text.
 */
export async function extractTextFromPdf(buffer) {
  let result;
  try {
    const parser = new PDFParse({ data: buffer });
    result = await parser.getText();
    await parser.destroy();
  } catch (err) {
    console.error('DEBUG pdf-parse failure:');
    console.error('err.message =', err && err.message);
    console.error('err.stack =', err && err.stack);
    throw new PdfParseError(
      'Could not read this PDF. It may be corrupted or password protected.',
      'PARSE_FAILED'
    );
  }

  const text = (result?.text || '').trim();

  if (text.length < MIN_TEXT_LENGTH) {
    throw new PdfParseError(
      'Could not extract enough readable text from this PDF. It may be a scanned image rather than real text.',
      'NO_USABLE_TEXT'
    );
  }

  return text;
}

export const PDF_MAX_FILE_SIZE = MAX_FILE_SIZE;