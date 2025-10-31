import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import AuthPage from './AuthPage';
import Dashboard from './components/dashboard/Dashboard';
import AuthLayout from './components/layout/AuthLayout';
import BrandHeader from './components/ui/BrandHeader';

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
      <AuthLayout>
        <BrandHeader loading={true} subtitle="Loading dashboard..." />
      </AuthLayout>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-brand-light">
      {!session ? <AuthPage /> : <Dashboard key={session.user.id} session={session} />}
    </div>
  );
}

export default App;