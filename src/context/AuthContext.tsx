import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { APP_CONFIG } from '../config';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string; message?: string; user?: any }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error?: string; message?: string; user?: any }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithEmail: (email: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  // Helper for quick testing/demo mode
  setDemoUser: (email: string, asAdmin?: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signInWithPassword: async () => ({}),
  signUpWithPassword: async () => ({}),
  signInWithGoogle: async () => ({}),
  signInWithEmail: async () => ({}),
  signOut: async () => {},
  setDemoUser: () => {},
});

const DEMO_USER_KEY = 'promptbazaar_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check admin status against config emails
  const checkIsAdmin = (email: string | undefined): boolean => {
    if (!email) return false;
    const normalized = email.toLowerCase().trim();
    return APP_CONFIG.adminEmails.some((adminEmail) => adminEmail.toLowerCase().trim() === normalized);
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            const email = session.user.email || '';
            setUser({
              id: session.user.id,
              email: email,
              name: session.user.user_metadata?.full_name || email.split('@')[0],
              avatar_url: session.user.user_metadata?.avatar_url,
              isAdmin: checkIsAdmin(email),
            });
          }

          // Listen to auth changes
          const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            if (currentSession?.user && mounted) {
              const email = currentSession.user.email || '';
              setUser({
                id: currentSession.user.id,
                email: email,
                name: currentSession.user.user_metadata?.full_name || email.split('@')[0],
                avatar_url: currentSession.user.user_metadata?.avatar_url,
                isAdmin: checkIsAdmin(email),
              });
            } else if (mounted) {
              setUser(null);
            }
          });

          return () => {
            authListener?.subscription.unsubscribe();
          };
        } catch (err) {
          console.warn('Supabase auth init error:', err);
        }
      } else {
        // Fallback demo user from localStorage
        const savedDemo = localStorage.getItem(DEMO_USER_KEY);
        if (savedDemo && mounted) {
          try {
            const parsed = JSON.parse(savedDemo);
            parsed.isAdmin = checkIsAdmin(parsed.email);
            setUser(parsed);
          } catch {
            // ignore
          }
        } else if (mounted) {
          // Default initial creator user for testing
          const defaultUser: UserProfile = {
            id: 'creator-demo-01',
            email: 'creator@promptbazaar.com',
            name: 'Rohit Creator',
            isAdmin: false,
          };
          setUser(defaultUser);
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(defaultUser));
        }
      }

      if (mounted) setLoading(false);
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithPassword = async (email: string, password: string): Promise<{ error?: string; message?: string; user?: any }> => {
    if (!email || !email.includes('@')) {
      return { error: 'Kripya valid email address enter karein.' };
    }
    if (!password || password.length < 6) {
      return { error: 'Password kam se kam 6 characters ka hona chahiye.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          // Provide user-friendly Hindi/Hinglish message for common errors
          if (error.message.includes('Invalid login credentials')) {
            return { error: 'Email ya password galat hai. Kripya check karein.' };
          }
          if (error.message.includes('Email not confirmed')) {
            return { error: 'Email abhi confirm nahi hui hai. Supabase Dashboard me confirm karein ya inbox check karein.' };
          }
          return { error: error.message };
        }

        if (data?.user) {
          const userEmail = data.user.email || email;
          const profile: UserProfile = {
            id: data.user.id,
            email: userEmail,
            name: data.user.user_metadata?.full_name || userEmail.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url,
            isAdmin: checkIsAdmin(userEmail),
          };
          setUser(profile);
          return { user: profile, message: 'Login safal raha!' };
        }
        return { message: 'Login ho gaya!' };
      } catch (err: any) {
        return { error: err.message || 'Login failed' };
      }
    } else {
      // Demo preview mode
      const isAdminEmail = checkIsAdmin(email);
      const demoUser: UserProfile = {
        id: 'user-' + Math.random().toString(36).substring(7),
        email: email.trim(),
        name: email.split('@')[0],
        isAdmin: isAdminEmail,
      };
      setUser(demoUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      return { user: demoUser, message: 'Logged in successfully!' };
    }
  };

  const signUpWithPassword = async (email: string, password: string): Promise<{ error?: string; message?: string; user?: any }> => {
    if (!email || !email.includes('@')) {
      return { error: 'Kripya valid email address enter karein.' };
    }
    if (!password || password.length < 6) {
      return { error: 'Password kam se kam 6 characters ka hona chahiye.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            return { error: 'Yeh email pehle se registered hai! Kripya Login karein.' };
          }
          return { error: error.message };
        }

        if (data?.session?.user) {
          const userEmail = data.session.user.email || email;
          const profile: UserProfile = {
            id: data.session.user.id,
            email: userEmail,
            name: data.session.user.user_metadata?.full_name || userEmail.split('@')[0],
            avatar_url: data.session.user.user_metadata?.avatar_url,
            isAdmin: checkIsAdmin(userEmail),
          };
          setUser(profile);
          return { user: profile, message: 'Account ban gaya aur aap login ho gaye!' };
        } else if (data?.user) {
          // If Supabase has "Confirm email" enabled
          return { 
            message: 'Account ban gaya! Ab aap seedhe email aur password se login kar sakte hain.' 
          };
        }
        return { message: 'Account create ho gaya!' };
      } catch (err: any) {
        return { error: err.message || 'Sign up failed' };
      }
    } else {
      // Demo preview mode
      const isAdminEmail = checkIsAdmin(email);
      const demoUser: UserProfile = {
        id: 'user-' + Math.random().toString(36).substring(7),
        email: email.trim(),
        name: email.split('@')[0],
        isAdmin: isAdminEmail,
      };
      setUser(demoUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      return { user: demoUser, message: 'Account safalta-purvak ban gaya!' };
    }
  };

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) return { error: error.message };
        return {};
      } catch (err: any) {
        return { error: err.message || 'Google Sign-in failed' };
      }
    } else {
      // Demo Google Sign-in simulation
      const demoUser: UserProfile = {
        id: 'google-user-' + Math.random().toString(36).substring(7),
        email: 'creator.india@gmail.com',
        name: 'Aakash Sharma',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        isAdmin: false,
      };
      setUser(demoUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      return {};
    }
  };

  const signInWithEmail = async (email: string): Promise<{ error?: string; message?: string }> => {
    if (!email || !email.includes('@')) {
      return { error: 'Kripya valid email address enter karein.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) return { error: error.message };
        return { message: 'Magic link aapki email par bhej diya gaya hai! Check your inbox.' };
      } catch (err: any) {
        return { error: err.message || 'Email login failed' };
      }
    } else {
      // Demo email login
      const isAdminEmail = checkIsAdmin(email);
      const demoUser: UserProfile = {
        id: 'user-' + Math.random().toString(36).substring(7),
        email,
        name: email.split('@')[0],
        isAdmin: isAdminEmail,
      };
      setUser(demoUser);
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      return { message: `Logged in as ${email} ${isAdminEmail ? '(Admin Mode Active)' : ''}` };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
  };

  const setDemoUser = (email: string, asAdmin = false) => {
    const demoUser: UserProfile = {
      id: asAdmin ? 'admin-user-01' : 'user-' + Math.random().toString(36).substring(7),
      email,
      name: email.split('@')[0],
      isAdmin: asAdmin || checkIsAdmin(email),
    };
    setUser(demoUser);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: Boolean(user?.isAdmin || (user?.email && checkIsAdmin(user.email))),
        signInWithPassword,
        signUpWithPassword,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        setDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
