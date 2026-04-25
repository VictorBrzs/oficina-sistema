import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { supabase } from '@/lib/supabase';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          setAccessToken(session.access_token);
          setUserEmail(session.user?.email || '');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
      setUserEmail(session?.user?.email ?? '');
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (token: string, email: string) => {
    setAccessToken(token);
    setUserEmail(email);
  };

  const handleAuthFailure = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error clearing invalid session:', error);
    } finally {
      setAccessToken(null);
      setUserEmail('');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setAccessToken(null);
      setUserEmail('');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),_transparent_32%),linear-gradient(180deg,_#fff7ed,_#f8fafc_55%,_#e5e7eb)] px-4">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-orange-100 border-t-orange-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Conectando ao Supabase...
          </p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Dashboard
      accessToken={accessToken}
      userEmail={userEmail}
      onAuthFailure={handleAuthFailure}
      onLogout={handleLogout}
    />
  );
}
