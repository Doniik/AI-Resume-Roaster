import formidable from 'formidable';
import fs from 'fs/promises';
import { validatePdfBuffer, extractTextFromPdf, PdfParseError, PDF_MAX_FILE_SIZE } from '../../lib/pdfParser';
import { roastResume, ClaudeRoastError } from '../../lib/claude';
import { getAuthenticatedUserId } from '../../lib/session';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: PDF_MAX_FILE_SIZE,
      multiples: false,
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const userId = await getAuthenticatedUserId(req, res);
  if (!userId) {
    return res.status(401).json({ error: 'You must be signed in to roast a resume.' });
  }

  let files;
  try {
    ({ files } = await parseForm(req));
  } catch (err) {
    if (err?.code === 1009 || /maxFileSize/i.test(err?.message || '')) {
      return res.status(413).json({ error: 'The file is larger than the 10MB limit.' });
    }
    return res.status(400).json({ error: 'Could not read the uploaded file.' });
  }

  const uploaded = files?.file;
  const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;

  if (!file) {
    return res.status(400).json({ error: 'No file was uploaded.' });
  }

  let buffer;
  try {
    buffer = await fs.readFile(file.filepath);
  } catch (err) {
    return res.status(400).json({ error: 'Could not read the uploaded file from disk.' });
  } finally {
    fs.unlink(file.filepath).catch(() => {});
  }

  try {
    validatePdfBuffer(buffer, file.originalFilename);
    const resumeText = await extractTextFromPdf(buffer);
    const roast = await roastResume(resumeText);

    const supabase = getSupabaseAdmin();
    const { data: savedRow, error: dbError } = await supabase
      .from('roasts')
      .insert({
        user_id: userId,
        resume_text: resumeText,
        roast_json: roast,
      })
      .select('id, created_at')
      .single();

    if (dbError) {
      console.error('Supabase insert failed:', dbError);
      return res.status(502).json({
        error: 'Your resume was analysed, but saving the result failed. Please try again.',
      });
    }

    return res.status(200).json({
      roast,
      id: savedRow.id,
      created_at: savedRow.created_at,
    });
  } catch (err) {
    if (err instanceof PdfParseError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof ClaudeRoastError) {
      return res.status(502).json({ error: err.message });
    }
    console.error('Unexpected /api/roast error:', err);
    return res.status(500).json({ error: 'Something went wrong while roasting your resume.' });
  }
}