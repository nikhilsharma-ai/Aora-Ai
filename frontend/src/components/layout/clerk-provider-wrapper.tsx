'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ClerkProvider, SignInButton, SignOutButton, useUser, useClerk } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Fallback user button
export function MockUserButton() {
  const { user, logout } = useAppStore();
  if (!user) return null;
  return (
    <div className="flex items-center gap-2">
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="w-8 h-8 rounded-full border border-brand-primary"
      />
      <div className="hidden md:block text-left">
        <p className="text-xs font-semibold text-foreground leading-none">{user.name}</p>
        <button
          onClick={logout}
          className="text-[10px] text-red-500 hover:underline leading-none cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// Clerk Auth Sync helper component
function ClerkAuthSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);
  const storeUser = useAppStore((state) => state.user);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress || '';
      const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
      const avatarUrl = user.imageUrl || '';
      // Always sync — covers both fresh login and page refresh
      login({ name, email, avatarUrl, streak: 0, plan: storeUser?.plan || 'Free Trial' });
    } else if (!isSignedIn && storeUser) {
      logout();
    }
  }, [isLoaded, isSignedIn, user]);


  return null;
}

// Export Wrapper
export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  if (clerkKey) {
    return (
      <ClerkProvider
        localization={{
          signIn: {
            start: {
              identifierPlaceholder: "nikhil@example.com"
            }
          },
          signUp: {
            start: {
              emailAddressPlaceholder: "nikhil@example.com"
            }
          }
        } as any}
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#8B5CF6',
            colorBackground: '#252525', // Dark card background matching the request
            colorText: '#ffffff',
            colorTextSecondary: '#8e8e93',
            colorInputBackground: '#202020', // Darker inputs matching the request
            colorInputText: '#ffffff',
          },
          elements: {
            card: "border border-[#3a3a3a] shadow-[0_8px_30px_rgb(0,0,0,0.3)] rounded-2xl p-8 max-w-[460px] w-full !bg-[#252525]",
            headerTitle: "!text-white text-2xl font-bold tracking-tight",
            headerSubtitle: "!text-zinc-400 text-xs mt-1",
            formButtonPrimary: "bg-[#8B5CF6] hover:bg-[#7C3AED] !text-white font-semibold text-sm h-11 rounded-lg transition-all duration-200",
            socialButtonsBlockButton: "!bg-[#171717] hover:!bg-[#222222] border border-[#3a3a3a] !text-zinc-200 font-medium text-sm h-11 rounded-lg transition-all duration-200",
            socialButtonsBlockButtonText: "!text-zinc-200 font-medium",
            formFieldInput: "!bg-[#202020] border border-[#3a3a3a] !text-white focus:border-violet-500 text-sm h-11 rounded-lg transition-all duration-150",
            formFieldLabel: "!text-zinc-200 text-xs font-semibold mb-1.5",
            dividerLine: "bg-zinc-800",
            dividerText: "!text-zinc-500 text-xs",
            footerActionText: "!text-zinc-400 text-sm",
            footerActionLink: "!text-white hover:!text-zinc-200 underline font-semibold text-sm",
            formFieldAction: "!text-zinc-400 hover:!text-white underline text-xs font-medium", // for 'Forgot password?' link
            footer: "hidden", // Removes the 'Secured by Clerk' branding and footer
          }
        } as any}
      >
        <ClerkAuthSync />
        {children}
      </ClerkProvider>
    );
  }

  // Simulated Auth Mock provider
  return <>{children}</>;
}

export function SignInButtonWrapper({ children }: { children: React.ReactNode }) {
  if (clerkKey) {
    return <SignInButton>{children}</SignInButton>;
  }
  const { login } = useAppStore();
  return <button onClick={() => login()} className="w-full text-left">{children}</button>;
}

export function SignOutButtonWrapper({ children }: { children: React.ReactNode }) {
  if (clerkKey) {
    return <SignOutButton>{children}</SignOutButton>;
  }
  const { logout } = useAppStore();
  return <button onClick={logout} className="w-full text-left">{children}</button>;
}

export function UserButtonWrapper() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { user: mockUser, logout: mockLogout } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeUser = clerkKey && isSignedIn ? {
    name: clerkUser?.fullName || 'User',
    avatarUrl: clerkUser?.imageUrl || '',
  } : mockUser;

  if (!activeUser) return null;

  const handleLogout = async () => {
    setIsOpen(false);
    if (clerkKey && isSignedIn) {
      await signOut();
    } else {
      mockLogout();
    }
    router.push('/');
  };

  const handleAccount = () => {
    setIsOpen(false);
    router.push('/settings');
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <style>{`
          .profile-container {
            position: relative;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            overflow: hidden;
            border: 1px solid var(--brand-border);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: border-color 0.25s;
          }
          .profile-container:hover {
            border-color: #7C3AED;
          }
          .profile-shine {
            position: absolute;
            top: 0;
            left: -100%;
            width: 60%;
            height: 100%;
            background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.55) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-25deg);
            transition: none;
            pointer-events: none;
          }
          .profile-container:hover .profile-shine {
            left: 125%;
            transition: all 0.65s ease-in-out;
          }
        `}</style>
        <div className="profile-container">
          <img
            src={activeUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
            alt="User Profile"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
          <div className="profile-shine" />
        </div>
      </button>

      {isOpen && (
        <div
            style={{
              position: 'absolute',
              right: 0,
              top: '42px',
              width: '160px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--brand-border)',
              borderTop: '3px solid #7C3AED',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              zIndex: 50,
              overflow: 'hidden',
              padding: '6px 0',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            <button
              onClick={handleAccount}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', background: 'none', border: 'none',
                color: 'var(--foreground)', fontSize: '13px', fontWeight: 500,
                textAlign: 'left', cursor: 'pointer', transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-accent)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <User style={{ width: '15px', height: '15px', color: 'var(--foreground)', opacity: 0.8 }} />
              Account
            </button>

            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', background: 'none', border: 'none',
                color: 'var(--foreground)', fontSize: '13px', fontWeight: 500,
                textAlign: 'left', cursor: 'pointer', transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-accent)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut style={{ width: '15px', height: '15px', color: 'var(--foreground)', opacity: 0.8 }} />
              Logout
            </button>
          </div>
      )}
    </div>
  );
}
