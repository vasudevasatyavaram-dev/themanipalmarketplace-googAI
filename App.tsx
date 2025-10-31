import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import LoginPage from './LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import StoreIcon from './components/ui/StoreIcon';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light text-center">
        <StoreIcon className="mb-4" />
        <h1 className="text-lg font-bold text-brand-dark tracking-wider">
            • the manipal marketplace •
        </h1>
        <p className="mt-2 text-md text-brand-dark/70 animate-pulse">
            Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-brand-light">
      {!session ? <LoginPage /> : <Dashboard key={session.user.id} session={session} />}
    </div>
  );
}

export default App;