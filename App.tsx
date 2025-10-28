import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';

const StoreIcon = () => (
    <div className="w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center shadow-lg mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FAF9E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" />
            <path d="M9 22V12H15V22" />
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