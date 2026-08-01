import { createClient } from '@supabase/supabase-js';

export const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || (!supabaseServiceRoleKey && !supabaseAnonKey)) {
    throw new Error(
      'Supabase server credentials are not configured. Expected NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  const resolvedKey = supabaseServiceRoleKey || supabaseAnonKey || '';

  return createClient(supabaseUrl, resolvedKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
