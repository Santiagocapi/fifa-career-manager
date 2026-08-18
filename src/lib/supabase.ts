// ============================================================
// src/lib/supabase.ts
// Supabase client initialization.
//
// HOW THIS WORKS:
// Supabase gives you a URL and an "anon key" from your dashboard.
// The anon key is safe to use in the browser — it only grants access
// based on Row Level Security (RLS) policies, which means users
// can ONLY access their own data.
//
// IMPORTANT: Never use the "service_role" key in the frontend.
// That key bypasses RLS and gives full database access.
// ============================================================

import { createClient } from '@supabase/supabase-js';

// These come from environment variables (your .env.local file).
// Vite exposes env vars prefixed with VITE_ to the browser.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

// Supabase recently updated their key system.
// Use the "Publishable key" (sb_publishable_...) from Settings > API Keys.
// The old "anon" key (from Legacy anon, service_role API keys tab) also works.
// NEVER use the "Secret key" here — it bypasses Row Level Security.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Store the session in localStorage so the user stays logged in
    // when they refresh the page
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper to get the current user's ID — useful in components
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};
