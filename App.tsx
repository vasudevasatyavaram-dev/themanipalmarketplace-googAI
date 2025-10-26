import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import type { Session } from '@supabase/supabase-js';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Spinner from './components/ui/Spinner';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supabase) {
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
    } else {
      setLoading(false);
    }
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
      {session ? <Dashboard key={session.user.id} session={session} /> : <Login />}
    </div>
  );
};

export default App;