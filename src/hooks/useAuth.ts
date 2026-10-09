// ============================================================
// src/hooks/useAuth.ts
// Authentication hook: wraps Supabase Auth (sign in, sign up with
// email confirmation, password recovery and sign out).
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export const MIN_PASSWORD_LENGTH = 8;

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface AuthResult {
  error: string | null;
}

interface SignUpResult extends AuthResult {
  /** True when the account exists but the user must open the link sent by email */
  needsConfirmation: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

// Links in emails come back to the app's own origin
const authUrl = (path: string) => `${window.location.origin}${path}`;

export const useAuth = (): AuthState & AuthActions => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount: restore the session (also completes a sign-in from an email link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Runs on login, logout and token refresh, even from another tab
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: authUrl('/auth') },
    });
    if (error) return { error: error.message, needsConfirmation: false };

    // With "Confirm email" on there is no session until the link is opened. An email that
    // is already registered answers the same way, so the UI cannot reveal who has an account.
    return { error: null, needsConfirmation: !data.session };
  };

  const resendConfirmation = async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: authUrl('/auth') },
    });
    return { error: error?.message ?? null };
  };

  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authUrl('/auth/reset'),
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    resendConfirmation,
    requestPasswordReset,
    updatePassword,
    signOut,
  };
};
