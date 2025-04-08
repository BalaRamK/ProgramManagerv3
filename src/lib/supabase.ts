import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// WARNING: The VITE_SUPABASE_SERVICE_ROLE_KEY should NEVER be exposed to the client-side.
// Any operations requiring admin privileges must be handled by a secure backend function (e.g., Supabase Edge Function).

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create supabase client with anonymous key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// REMOVED: supabaseAdmin client initialization.
// Admin operations must be moved to secure backend functions.
// Example: Call an Edge Function instead of using supabaseAdmin directly.
// export const supabaseAdmin = supabaseServiceRoleKey
//   ? createClient(supabaseUrl, supabaseServiceRoleKey, {
//       auth: {
//         autoRefreshToken: false,
//         persistSession: false
//       }
//     })
//   : supabase; // Fallback to regular client if no service role key
