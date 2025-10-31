import React from 'react';

interface StoreIconProps {
  className?: string;
}

const StoreIcon: React.FC<StoreIconProps> = ({ className = '' }) => (
    <div className={`w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center shadow-lg ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FAF9E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    </div>
);

export default StoreIcon;
