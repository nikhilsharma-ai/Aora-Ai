'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'neobrutalist';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
    
    const variants = {
      primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/15 active:scale-98',
      secondary: 'bg-brand-accent text-brand-primary hover:bg-brand-accent/80',
      outline: 'border border-brand-border bg-white text-foreground hover:bg-brand-muted hover:border-brand-primary/40',
      ghost: 'text-foreground hover:bg-brand-muted hover:text-brand-primary',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/10',
      neobrutalist: 'bg-white border-2 border-foreground shadow-neobrutal hover:shadow-neobrutal-hover hover:-translate-x-[2px] hover:-translate-y-[2px]',
    };

    const sizes = {
      sm: 'h-9 px-4 text-xs rounded-lg',
      md: 'h-11 px-6 text-sm',
      lg: 'h-13 px-8 text-base rounded-2xl',
      icon: 'h-10 w-10 p-0 rounded-xl',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...(props as any)}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
