import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User;
  onOpenProfile: () => void;
  onNavigate: (view: 'dashboard' | 'best_practices') => void;
  onOpenHelp: () => void;
}

const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
);

const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);

const HelpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);

const StorefrontIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);

const Header: React.FC<HeaderProps> = ({ user, onOpenProfile, onNavigate, onOpenHelp }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const createMenuAction = (action: () => void) => () => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-brand-cream/80 backdrop-blur-xl sticky top-0 z-10 border-b border-brand-dark/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button onClick={createMenuAction(() => onNavigate('dashboard'))} className="flex-shrink-0 text-left">
            <h3 className="text-2xl font-bold text-brand-dark leading-tight">
                Seller Dashboard
            </h3>
            <h3 className="text-xs text-brand-dark/60 tracking-wider">
                • the manipal marketplace •
            </h3>
          </button>
          <div className="flex items-center gap-2">
            <a
              href="https://the-manipal-marketplace.myshopify.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/20 transition-colors w-12 h-12 rounded-lg font-semibold"
              aria-label="View Storefront"
              title="View Storefront"
            >
              <StorefrontIcon />
            </a>
            <div className="relative" ref={menuRef}>
              <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center justify-center text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/20 transition-colors w-12 h-12 rounded-lg font-semibold"
                  aria-label="Open menu"
                  aria-expanded={isMenuOpen}
                >
                  <MenuIcon />
              </button>
              {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-brand-cream border border-brand-dark/10 rounded-lg shadow-2xl py-2 z-20 animate-fade-in-fast">
                      <div className="px-4 py-3 border-b border-brand-dark/10">
                          <p className="text-sm font-semibold text-brand-dark">Signed in as</p>
                          <p className="text-sm text-brand-dark/80 truncate">{user.email}</p>
                      </div>
                      <nav className="py-1">
                          <button onClick={createMenuAction(() => onNavigate('dashboard'))} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-brand-dark hover:bg-brand-dark/5 transition-colors">
                              <DashboardIcon />
                              <span>Dashboard</span>
                          </button>
                          <button onClick={createMenuAction(onOpenProfile)} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-brand-dark hover:bg-brand-dark/5 transition-colors">
                              <UserIcon />
                              <span>Profile Settings</span>
                          </button>
                           <button onClick={createMenuAction(() => onNavigate('best_practices'))} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-brand-dark hover:bg-brand-dark/5 transition-colors">
                              <BookIcon />
                              <span>Best Practices</span>
                          </button>
                           <button onClick={createMenuAction(onOpenHelp)} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-brand-dark hover:bg-brand-dark/5 transition-colors">
                              <HelpIcon />
                              <span>Help & Support</span>
                          </button>
                      </nav>
                      <div className="py-1 border-t border-brand-dark/10">
                          <button onClick={async () => {
                              setIsMenuOpen(false); // Close menu first for better responsiveness
                              const { error } = await supabase.auth.signOut();
                              if (error) {
                                  console.error('Error logging out:', error.message);
                                  alert('Failed to log out. Please try again.');
                              }
                          }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-brand-accent hover:bg-brand-dark/5 transition-colors">
                              <LogOutIcon />
                              <span>Logout</span>
                          </button>
                      </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;