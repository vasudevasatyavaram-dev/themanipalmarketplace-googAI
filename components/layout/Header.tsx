import React from 'react';
import { supabase } from '../../services/supabase';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User;
  onOpenProfile: () => void;
  onNavigate: (view: 'dashboard' | 'best_practices') => void;
}

const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
);


const Header: React.FC<HeaderProps> = ({ user, onOpenProfile, onNavigate }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-brand-cream/80 backdrop-blur-xl sticky top-0 z-10 border-b border-brand-dark/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button onClick={() => onNavigate('dashboard')} className="flex-shrink-0 text-left">
            <h1 className="text-2xl font-bold text-brand-dark leading-tight">
                Seller Dashboard
            </h1>
            <p className="text-xs text-brand-dark/60 tracking-wider">
                • the manipal marketplace •
            </p>
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-brand-dark/80 hidden sm:block font-medium text-sm truncate max-w-[200px]">{user.email || user.phone}</span>
             <button
                onClick={() => onNavigate('best_practices')}
                className="flex items-center justify-center text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/20 transition-colors w-10 h-10 rounded-lg font-semibold"
                title="Best Practices"
              >
                <BookIcon />
              </button>
             <button
              onClick={onOpenProfile}
              className="flex items-center justify-center text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/20 transition-colors w-10 h-10 rounded-lg font-semibold"
              title="Profile Settings"
            >
              <UserIcon />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/20 transition-colors px-3 sm:px-4 h-10 rounded-lg font-semibold"
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