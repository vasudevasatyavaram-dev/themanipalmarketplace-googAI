import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';

const StoreIcon = () => (
    <div className="w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center shadow-lg mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FAF9E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    </div>
);


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
        <StoreIcon />
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
      {!session ? <Login /> : <Dashboard key={session.user.id} session={session} />}
    </div>
  );
}

export default App;