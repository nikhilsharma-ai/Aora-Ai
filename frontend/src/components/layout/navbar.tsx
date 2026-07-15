'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { LogIn, Search, ArrowLeft, X } from 'lucide-react';
import { navigationItems } from './sidebar';
import { UserButtonWrapper } from './clerk-provider-wrapper';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, login, searchQuery, setSearchQuery } = useAppStore();

  const [searchFocused, setSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (pathname === '/') return null;

  const currentNav = navigationItems.find(item => item.href === pathname);
  const pageTitle = currentNav ? currentNav.name : 'Workspace';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        borderBottom: '1px solid var(--brand-border)',
        backgroundColor: 'var(--sidebar-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '0 28px',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Mobile search overlay */}
      {isMobileSearchOpen && pathname === '/dashboard' && (
        <div 
          className="absolute inset-0 z-50 flex items-center px-4 gap-3 sm:hidden"
          style={{ backgroundColor: 'var(--sidebar-bg)' }}
        >
          <button
            onClick={() => {
              setIsMobileSearchOpen(false);
              setSearchQuery('');
            }}
            className="p-1 text-[#9090A8] hover:text-foreground cursor-pointer flex items-center justify-center bg-transparent border-none outline-none"
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative flex items-center">
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#9090A8', pointerEvents: 'none' }} />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full h-10 pl-9 pr-8 bg-brand-accent border border-brand-border rounded-xl text-sm text-foreground outline-none focus:ring-1 focus:ring-brand-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#9090A8] hover:text-foreground cursor-pointer bg-transparent border-none outline-none"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="pl-12 md:pl-0 flex items-center" style={{ gap: '8px' }}>
        <span 
          className="hidden sm:inline"
          style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', fontFamily: "'Outfit', sans-serif" }}
        >
          {pageTitle}
        </span>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        {/* Search Box (placed where notification bell used to be on the Dashboard) */}
        {pathname === '/dashboard' && (
          <>
            {/* Desktop search bar */}
            <div className="hidden sm:block relative mr-1">
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: '#9090A8', pointerEvents: 'none' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search (⌘K)"
                className="w-40 md:w-56"
                style={{
                  height: '36px',
                  paddingLeft: '34px',
                  paddingRight: '14px',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid',
                  borderColor: searchFocused ? '#7C3AED' : 'var(--brand-border)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--foreground)',
                  outline: 'none',
                  boxShadow: searchFocused ? '0 0 0 3px rgba(124, 58, 237, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.15s ease-in-out',
                  fontFamily: "'Inter', sans-serif"
                }}
              />
            </div>

            {/* Mobile search icon trigger */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="sm:hidden p-2 text-[#9090A8] hover:text-foreground cursor-pointer rounded-lg hover:bg-brand-accent/50 flex items-center justify-center bg-transparent border-none outline-none"
              type="button"
            >
              <Search className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--brand-border)' }} />

        {/* User */}
        {isAuthenticated ? (
          <UserButtonWrapper />
        ) : (
          <button
            onClick={() => login()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px',
              background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
              border: 'none', borderRadius: '8px',
              color: '#ffffff', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'opacity 0.15s',
              boxShadow: '0 2px 8px rgba(124,58,237,0.25)',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <LogIn style={{ width: '14px', height: '14px' }} />
            Login
          </button>
        )}
      </div>
    </header>
  );
}
