'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={twMerge('flex flex-col space-y-4', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue: value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, className, activeValue, onValueChange }: any) {
  return (
    <div className={twMerge('flex p-1 gap-1 rounded-xl bg-brand-muted border border-brand-border/60 self-start', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeValue, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ value, children, className, activeValue, onValueChange }: any) {
  const isActive = activeValue === value;
  return (
    <button
      onClick={() => onValueChange(value)}
      className={twMerge(
        'relative px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all focus:outline-none cursor-pointer',
        isActive ? 'text-brand-primary' : 'text-foreground/50 hover:text-foreground/80',
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute inset-0 bg-white rounded-lg shadow-sm border border-brand-border/30 z-0"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function TabsContent({ value, children, activeValue }: any) {
  if (activeValue !== value) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
