import React from 'react';
import { supabase } from '../../services/supabase';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User;
}

const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

const Header: React.FC<HeaderProps> = ({ user }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-brand-dark/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 border-b border-brand-light/10">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-brand-cream">
                Seller Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-brand-light/80 hidden sm:block">{user.email || user.phone}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-brand-light hover:text-white bg-brand-accent/80 hover:bg-brand-accent transition-colors px-4 py-2 rounded-lg font-medium"
            >
              <LogOutIcon />
              <span className="hidden md:block">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;