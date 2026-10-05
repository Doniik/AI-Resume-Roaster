import { getAuthenticatedUserId } from '../../lib/session';
import { getSupabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const userId = await getAuthenticatedUserId(req, res);
  if (!userId) {
    return res.status(401).json({ error: 'You must be signed in to view your history.' });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('roasts')
    .select('id, roast_json, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase history fetch failed:', error);
    return res.status(502).json({ error: 'Could not load your history right now.' });
  }

  return res.status(200).json({ roasts: data });
}