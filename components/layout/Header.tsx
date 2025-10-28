import React from 'react';
import { supabase } from '../../services/supabase';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User;
}

const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

const Header: React.FC<HeaderProps> = ({ user }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-brand-cream/80 backdrop-blur-md sticky top-0 z-10 border-b border-brand-dark/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-brand-dark leading-tight">
                Seller Dashboard
            </h1>
            <p className="text-xs text-brand-dark/60 tracking-wider">
                • the manipal marketplace •
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-brand-dark/80 hidden sm:block font-medium">{user.email || user.phone}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/20 transition-colors px-4 py-2 rounded-lg font-semibold"
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