import { createClient } from '@supabase/supabase-js';

export const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missingVars: string[] = [];
  if (!supabaseUrl) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseServiceRoleKey && !supabaseAnonKey) {
    missingVars.push('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Supabase server credentials are not configured. Missing: ${missingVars.join(', ')}.`
    );
  }

  return createClient(supabaseUrl!, supabaseServiceRoleKey || supabaseAnonKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
