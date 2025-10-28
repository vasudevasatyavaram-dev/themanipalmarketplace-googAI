import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User;
  onOpenProfile: () => void;
  onOpenReportProblem: () => void;
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
const HelpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);


const Header: React.FC<HeaderProps> = ({ user, onOpenProfile, onNavigate, onOpenReportProblem }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleMenuNavigation = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };
  
  const handleViewNavigation = (view: 'dashboard' | 'best_practices') => {
    onNavigate(view);
    setIsMenuOpen(false);
  }

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
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            <span className="text-brand-dark/80 font-medium text-sm truncate max-w-[200px]">{user.email || user.phone}</span>
             <button
                onClick={() => onNavigate('best_practices')}
                className="flex items-center justify-center text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/20 transition-colors w-10 h-10 rounded-lg font-semibold"
                title="Best Practices"
              >
                <BookIcon />
              </button>
              <button
                onClick={onOpenReportProblem}
                className="flex items-center justify-center text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/20 transition-colors w-10 h-10 rounded-lg font-semibold"
                title="Help & Support"
              >
                <HelpIcon />
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/20 transition-colors w-10 h-10 rounded-lg font-semibold"
              title="Logout"
            >
              <LogOutIcon />
            </button>
            <button onClick={() => setIsMenuOpen(true)} className="p-2">
              <MenuIcon />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Panel */}
      <div className={`fixed inset-0 z-50 transition-transform transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}>
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsMenuOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-64 bg-brand-light shadow-2xl p-5">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="font-bold text-xl">Menu</h2>
                  <button onClick={() => setIsMenuOpen(false)} className="text-3xl">&times;</button>
              </div>
              <nav className="flex flex-col gap-2">
                  <button onClick={() => handleViewNavigation('dashboard')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-dark/5 font-semibold text-left">
                      <HomeIcon /> Dashboard
                  </button>
                  <button onClick={() => handleViewNavigation('best_practices')} className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-dark/5 font-semibold text-left">
                      <BookIcon /> Best Practices
                  </button>
                  <button onClick={() => handleMenuNavigation(onOpenReportProblem)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-dark/5 font-semibold text-left">
                      <HelpIcon /> Help & Support
                  </button>
                  <button onClick={() => handleMenuNavigation(onOpenProfile)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-dark/5 font-semibold text-left">
                      <UserIcon /> Profile
                  </button>
              </nav>
          </div>
      </div>
    </header>
  );
};

export default Header;