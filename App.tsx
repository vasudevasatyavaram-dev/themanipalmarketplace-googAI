import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Spinner from './components/ui/Spinner';

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
