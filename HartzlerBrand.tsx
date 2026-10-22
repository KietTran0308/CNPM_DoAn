import React from 'react';

export const HartzlerWordmark: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xl sm:text-2xl',
    md: 'text-2xl sm:text-3xl lg:text-4xl',
    lg: 'text-3xl sm:text-4xl lg:text-5xl',
  }[size];

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-center gap-1.5 leading-none">
        <span
          className={`font-black uppercase tracking-tight text-[#035542] ${sizeClasses}`}
          style={{ fontFamily: "'Work Sans', sans-serif" }}
        >
          BREW LITE
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#56dddb] mb-0.5" />
      </div>
      <span
        className="text-[9px] sm:text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-[#035542]/80 uppercase mt-0.5"
        style={{ fontFamily: "'Work Sans', sans-serif" }}
      >
        CÀ PHÊ · BÁNH NGỌT · KEM
      </span>
    </div>
  );
};

export const FeaturedSeal: React.FC<{ size?: number; label?: string; className?: string }> = ({
  size,
  label = 'FEATURED',
  className = '',
}) => {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div
      style={style}
      className={`rounded-full aspect-square border border-white/80 bg-white/70 backdrop-blur-[16px] text-[#035542] flex flex-col items-center justify-center p-2 relative select-none uppercase shrink-0 text-center box-border shadow-md ring-1 ring-emerald-900/10 ${!size ? 'w-20 h-20 sm:w-24 sm:h-24 md:w-[100px] md:h-[100px]' : ''
        } ${className}`}
    >
      <div className="text-[7px] sm:text-[8px] font-bold tracking-[0.16em] text-[#035542]/70 leading-tight whitespace-nowrap">
        EST. 2024
      </div>
      <div className="text-[9px] sm:text-[11px] font-black tracking-[0.12em] text-[#035542] border-y border-[#035542]/20 py-0.5 my-0.5 w-[85%] text-center truncate px-0.5">
        {label}
      </div>
      <div className="text-[6.5px] sm:text-[7.5px] font-bold tracking-[0.14em] text-[#035542]/80 leading-tight whitespace-nowrap">
        BREW LITE CAFÉ
      </div>
    </div>
  );
};

export const DecorativeWaveGlyph: React.FC<{ color?: string; className?: string }> = ({
  color = '#56dddb',
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 select-none overflow-hidden shrink-0 ${className}`}>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className="text-base sm:text-lg font-black leading-none"
          style={{ color }}
        >
          ▲
        </span>
      ))}
    </div>
  );
};
