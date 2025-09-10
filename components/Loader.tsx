
import React from 'react';

export const Loader: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg 
        className={`animate-spin ${className}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M12 2a10 10 0 00-7.071 17.071m0 0A10 10 0 1012 2"
            className="opacity-25"
        />
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M12 2a10 10 0 017.071 2.929"
            className="opacity-75"
        />
    </svg>
);
