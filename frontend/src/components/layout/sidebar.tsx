'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UserButtonWrapper } from './clerk-provider-wrapper';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import {
  Home,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
  Pencil,
  FileText,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

export const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Chatbot', href: '/chat', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const workspaceItems = [
  { name: 'Document', tab: 'document' as const, icon: FileText },
  { name: 'Chat Bot', tab: 'chat' as const, icon: MessageSquare },
  { name: 'Quiz', tab: 'quiz' as const, icon: HelpCircle },
];



// ─── Sidebar Component ─────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { openUpgradeModal } = useUIStore();

  const isWorkspace = pathname.startsWith('/notes');
  const { activeNotesTab, setActiveNotesTab } = useAppStore();

  if (pathname === '/') return null;

  const sidebarBase: React.CSSProperties = {
    backgroundColor: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--brand-border)',
    height: '100vh',
    position: 'sticky' as const,
    top: 0,
    zIndex: 30,
    flexShrink: 0,
    overflow: 'hidden',
    userSelect: 'none',
    padding: '20px 12px',
  };

  const NavLink = ({
    item,
    collapsed = false,
    onClick,
  }: {
    item: typeof navigationItems[0];
    collapsed?: boolean;
    onClick?: () => void;
  }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        onClick={onClick}
        title={collapsed ? item.name : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: collapsed ? '10px' : '9px 12px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? 'var(--foreground)' : '#6B6B8A',
          backgroundColor: isActive ? 'var(--brand-accent)' : 'transparent',
          textDecoration: 'none',
          transition: 'all 0.15s ease',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'var(--brand-accent)';
            e.currentTarget.style.color = 'var(--foreground)';
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6B6B8A';
          }
        }}
      >
        <item.icon
          style={{
            width: '16px',
            height: '16px',
            flexShrink: 0,
            color: isActive ? 'var(--foreground)' : '#6B6B8A',
          }}
        />
        {!collapsed && (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile trigger */}
      <div 
        className="md:hidden fixed z-40"
        style={{
          top: isWorkspace ? '10px' : '14px',
          left: '16px'
        }}
      >
        <button
          onClick={() => setIsMobileOpen(true)}
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--brand-border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            color: 'var(--foreground)',
          }}
        >
          <Menu style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            className="md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex flex-col md:hidden"
            style={{ ...sidebarBase, position: 'fixed', top: 0, bottom: 0, left: 0, width: '260px', zIndex: 50 }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingLeft: '4px' }}>
              <Link href="/dashboard" onClick={() => setIsMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <Pencil style={{ width: '16px', height: '16px', color: '#7C3AED' }} />
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.01em' }}>aora ai</span>
              </Link>
              <button onClick={() => setIsMobileOpen(false)} style={{ background: 'none', border: 'none', color: '#9090A8', cursor: 'pointer', padding: '4px' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              {isWorkspace ? (
                workspaceItems.map(item => {
                  const isActive = activeNotesTab === item.tab;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveNotesTab(item.tab);
                        setIsMobileOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--foreground)' : '#6B6B8A',
                        backgroundColor: isActive ? 'var(--brand-accent)' : 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        width: '100%',
                        fontFamily: "'Inter', sans-serif"
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--brand-accent)';
                          e.currentTarget.style.color = 'var(--foreground)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6B6B8A';
                        }
                      }}
                    >
                      <item.icon
                        style={{
                          width: '16px',
                          height: '16px',
                          flexShrink: 0,
                          color: isActive ? 'var(--foreground)' : '#6B6B8A',
                        }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                    </button>
                  );
                })
              ) : (
                navigationItems.map(item => (
                  <NavLink key={item.name} item={item} onClick={() => setIsMobileOpen(false)} />
                ))
              )}
            </nav>

            <div style={{ borderTop: '1px solid var(--brand-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={openUpgradeModal}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#7C3AED',
                  border: 'none',
                  borderRadius: '24px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Upgrade to Premium
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Collapsible Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 68 : 252 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        style={sidebarBase}
        className="hidden md:flex flex-col"
      >
        {/* Logo and Collapse Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: '28px', paddingLeft: isCollapsed ? 0 : '4px' }}>
          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(false)}
              style={{ background: 'none', border: 'none', color: '#9090A8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronsRight style={{ width: '16px', height: '16px', color: 'var(--foreground)' }} />
            </button>
          ) : (
            <>
              <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <Pencil style={{ width: '16px', height: '16px', color: '#7C3AED' }} />
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>aora ai</span>
              </Link>
              <button
                onClick={() => setIsCollapsed(true)}
                style={{ background: 'none', border: 'none', color: '#9090A8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronsLeft style={{ width: '16px', height: '16px', color: 'var(--foreground)' }} />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {isWorkspace ? (
            workspaceItems.map(item => {
              const isActive = activeNotesTab === item.tab;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveNotesTab(item.tab)}
                  title={isCollapsed ? item.name : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: isCollapsed ? '10px' : '9px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--foreground)' : '#6B6B8A',
                    backgroundColor: isActive ? 'var(--brand-accent)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    width: '100%',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    fontFamily: "'Inter', sans-serif"
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--brand-accent)';
                      e.currentTarget.style.color = 'var(--foreground)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6B6B8A';
                    }
                  }}
                >
                  <item.icon
                    style={{
                      width: '16px',
                      height: '16px',
                      flexShrink: 0,
                      color: isActive ? 'var(--foreground)' : '#6B6B8A',
                    }}
                  />
                  {!isCollapsed && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            navigationItems.map(item => (
              <NavLink key={item.name} item={item} collapsed={isCollapsed} />
            ))
          )}
        </nav>

        {/* Bottom: Upgrade + User */}
        <div style={{ borderTop: '1px solid var(--brand-border)', paddingTop: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!isCollapsed && (
            <button
              onClick={openUpgradeModal}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#7C3AED',
                border: 'none',
                borderRadius: '24px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                fontFamily: "'Inter', sans-serif",
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}
