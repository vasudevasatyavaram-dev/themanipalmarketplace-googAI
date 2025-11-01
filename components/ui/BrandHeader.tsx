import React from 'react';
import StoreIcon from './StoreIcon';

interface BrandHeaderProps {
    loading?: boolean;
    subtitle?: string;
}

const BrandHeader: React.FC<BrandHeaderProps> = ({ loading = false, subtitle }) => (
    <div className="text-center mb-4">
        <div className="inline-block">
            <StoreIcon />
        </div>
        {loading ? (
             <h1 className="mt-3 text-lg font-bold text-brand-dark tracking-wider">
                • the manipal marketplace •
            </h1>
        ) : (
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-brand-dark tracking-normal sm:tracking-wider whitespace-nowrap">
                <span className="text-brand-accent">•</span> the manipal marketplace <span className="text-brand-accent">•</span>
            </h1>
        )}
        {subtitle && (
            <p className={`mt-1 text-sm text-brand-dark/70 ${loading ? 'animate-pulse' : ''}`}>
                {subtitle}
            </p>
        )}
    </div>
);

export default BrandHeader;