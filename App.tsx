import { useState, useEffect } from 'react';
import { supabase, supabaseInitializationError } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Spinner from './components/ui/Spinner';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Immediately render an error screen if Supabase isn't configured.
  if (supabaseInitializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 font-sans">
        <div className="max-w-2xl text-center bg-white p-8 rounded-lg shadow-lg border-2 border-red-200">
          <h1 className="text-3xl font-bold text-red-700 mb-4">Configuration Error</h1>
          <p className="text-lg text-red-900">{supabaseInitializationError}</p>
          <p className="mt-4 text-md text-slate-600">
            Please ensure the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are set correctly in your hosting environment.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Since we've passed the error check, supabase is guaranteed to be non-null.
    supabase!.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <Spinner />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans ${!session ? 'bg-brand-light' : 'bg-brand-dark'}`}>
      {!session ? <Login /> : <Dashboard key={session.user.id} session={session} />}
    </div>
  );
}

export default App;