import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  isCompanyUser: boolean;
  signUp: (email: string, password: string, emailRedirectTo?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string, returnTo?: string) => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isCompanyUser, setIsCompanyUser] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const checkCompanyUser = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        setIsCompanyUser(!!data);
      } catch {
        setIsCompanyUser(false);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Stale or invalid session — clear state silently
        setSession(null);
        setUser(null);
        setIsCompanyUser(false);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkCompanyUser(session.user.id);
      } else {
        setIsCompanyUser(false);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          checkCompanyUser(session.user.id);
        } else {
          setIsCompanyUser(false);
        }
        setLoading(false);

        // Detect password recovery flow - immediately redirect to reset page
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          navigate('/reset-password', { replace: true });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signUp = async (email: string, password: string, emailRedirectTo?: string) => {
    if (!supabase) return { error: new Error('Database not configured') };
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Database not configured') };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string, returnTo?: string) => {
    if (!supabase) return { error: new Error('Database not configured') };

    // Build the callback URL with optional returnTo parameter
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    if (returnTo) {
      callbackUrl.searchParams.set('returnTo', returnTo);
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });
    return { error: error as Error | null };
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!supabase) return { error: new Error('Database not configured') };

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase) return { error: new Error('Database not configured') };

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (!error) {
      // Clear the recovery flag after successful password update
      setIsPasswordRecovery(false);
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (!supabase) return;
    setIsPasswordRecovery(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isPasswordRecovery, isCompanyUser, signUp, signIn, signInWithMagicLink, resetPasswordForEmail, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
