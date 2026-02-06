import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Client } from '../lib/types';

interface AuthContextType {
  user: { id: number; email: string } | null;
  client: Client | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, clientData: Partial<Client>) => Promise<{ error: Error | null }>;
  signInWithGoogle: (credential: string) => Promise<{ error: Error | null }>;
  signInWithFacebook: (accessToken: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const REQUIRE_LOGIN_ON_START = (import.meta.env.VITE_REQUIRE_LOGIN_ON_START ?? 'false') === 'true';

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (REQUIRE_LOGIN_ON_START) {
          localStorage.removeItem("auth_token");
          setLoading(false);
          return;
        }
        const token = localStorage.getItem("auth_token");
        if (!token) {
          try {
            const demoRes = await fetch(`${API_URL}/auth/demo-client`);
            if (demoRes.ok) {
              const demoData = await demoRes.json();
              setUser(null);
              setClient(demoData.client || null);
            }
          } catch {
            setUser(null);
            setClient(null);
          } finally {
            setLoading(false);
          }
          return;
        }

        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
          setClient(data.client || null);
        } else if (res.status === 404) {
          // Endpoint doesn't exist, clear token
          localStorage.removeItem("auth_token");
          setUser(null);
          setClient(null);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("auth_token");
        setUser(null);
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || 'Login failed') };
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      setClient(data.client);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign up new user
  const signUp = async (email: string, password: string, clientData: Partial<Client>) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...clientData }),
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || 'Registration failed') };
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      setClient(data.client);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Google sign in
  const signInWithGoogle = async (credential: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || 'Google login failed') };
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      setClient(data.client);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Facebook sign in
  const signInWithFacebook = async (accessToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/facebook-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || 'Facebook login failed') };
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      setClient(data.client);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };


  // Sign out user
  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setClient(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        client,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithFacebook,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
