import { createClient } from '@supabase/supabase-js';
import type { Settings } from './types';

// Server-only service-role client. Never import from client components.
export const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

export async function getSettings(): Promise<Settings> {
  const { data, error } = await db.from('settings').select('data').eq('id', 1).single();
  if (error) throw error;
  return data.data as Settings;
}
