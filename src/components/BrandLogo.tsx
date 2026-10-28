import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', className = '' }) => {
  const dimensions = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-indigo-600 p-[1.5px] shadow-sm shadow-amber-500/10 ${dimensions} ${className}`}
    >
      <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 text-amber-400"
        >
          {/* Futuristic stylized 'M' with Devanagari matra & neural node spark */}
          <path
            d="M4 19V7L9.5 14.5L12 11L14.5 14.5L20 7V19"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="5" r="2" fill="#f59e0b" />
          <path
            d="M8 5C9 3.5 15 3.5 16 5"
            stroke="#6366f1"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
