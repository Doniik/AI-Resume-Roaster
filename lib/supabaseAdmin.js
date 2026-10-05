import { createClient } from '@supabase/supabase-js';

let _supabaseAdmin = null;

export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase server credentials are not configured.');
  }

  _supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  return _supabaseAdmin;
}