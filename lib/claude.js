import Anthropic from '@anthropic-ai/sdk';

const REQUIRED_FIELDS = ['strengths', 'weaknesses', 'score', 'actionable_tips'];

export class ClaudeRoastError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ClaudeRoastError';
    this.code = code;
  }
}

function buildPrompt(resumeText) {
  const system =
    'You are an honest but constructive AI resume roaster. You give direct, truthful ' +
    'feedback aimed at genuinely helping the candidate improve, not empty praise and not ' +
    'needless harshness.';

  const userPrompt = `
CONTEXT:
The following text was extracted from a candidate's resume (PDF). Treat it as a whole document and consider how well it would perform with real recruiters and applicant tracking systems, not just as isolated lines.

TASK:
Critically analyze this resume. Identify genuine strengths, genuine weaknesses, and practical, specific improvements the candidate could actually act on. Be honest rather than generic. Base every point on what is actually in the text below — do not invent experience or details that are not present.

FORMAT:
Respond with valid JSON only, using exactly this structure and these field names, and nothing else (no markdown, no code fences, no commentary before or after):

{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "score": 0,
  "actionable_tips": ["...", "..."]
}

"score" must be an integer from 0 to 100 reflecting overall resume quality.
"strengths", "weaknesses", and "actionable_tips" must each be arrays of short, specific strings.

RESUME TEXT:
"""
${resumeText}
"""
`.trim();

  return { system, userPrompt };
}

function extractJsonFromResponse(rawText) {
  let cleaned = rawText.trim();
  cleaned = cleaned
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new ClaudeRoastError('Claude returned a response that was not valid JSON.', 'INVALID_JSON');
  }
}

function validateRoastShape(parsed) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in parsed)) {
      throw new ClaudeRoastError(
        `Claude's response is missing the required field "${field}".`,
        'MISSING_FIELD'
      );
    }
  }
  if (
    !Array.isArray(parsed.strengths) ||
    !Array.isArray(parsed.weaknesses) ||
    !Array.isArray(parsed.actionable_tips)
  ) {
    throw new ClaudeRoastError(
      'Claude returned strengths/weaknesses/actionable_tips in the wrong format.',
      'BAD_FIELD_TYPE'
    );
  }
  if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) {
    throw new ClaudeRoastError('Claude returned an invalid score.', 'BAD_SCORE');
  }

  return {
    strengths: parsed.strengths.map(String),
    weaknesses: parsed.weaknesses.map(String),
    score: Math.round(parsed.score),
    actionable_tips: parsed.actionable_tips.map(String),
  };
}

export async function roastResume(resumeText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeRoastError('Server is missing ANTHROPIC_API_KEY.', 'MISSING_API_KEY');
  }

  const client = new Anthropic({ apiKey });
  const { system, userPrompt } = buildPrompt(resumeText);

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    });
  } catch (err) {
    console.error('Anthropic API error:', {
      status: err?.status,
      type: err?.type,
      message: err?.message,
      body: err?.body,
    });

    if (err?.status === 401) {
      throw new ClaudeRoastError(
        'Anthropic API key is invalid or expired. Check ANTHROPIC_API_KEY in your environment.',
        'INVALID_API_KEY'
      );
    }

    throw new ClaudeRoastError(
      'The AI service failed to respond. Please try again in a moment.',
      'CLAUDE_API_ERROR'
    );
  }

  const textBlock = response?.content?.find((block) => block.type === 'text');
  if (!textBlock || !textBlock.text) {
    throw new ClaudeRoastError('The AI service returned an empty response.', 'EMPTY_RESPONSE');
  }

  const parsed = extractJsonFromResponse(textBlock.text);
  return validateRoastShape(parsed);
}