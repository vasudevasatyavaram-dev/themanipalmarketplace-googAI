import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-16 py-8 border-t border-brand-dark/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-brand-dark/60">
        <p className="font-semibold text-sm">the manipal marketplace</p>
        <p className="text-xs mt-1">
          &copy; {new Date().getFullYear()} Seller Dashboard. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
