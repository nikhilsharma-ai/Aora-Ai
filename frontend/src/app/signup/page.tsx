'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useSignUp, useSignIn } from '@clerk/nextjs/legacy';
import { useAuth } from '@clerk/nextjs';

// ─── Shared Styles (Light Theme — Image 1) ────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '42px',
  backgroundColor: '#f5f5f5',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '0 14px',
  color: '#1a1a1a',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#6b6b6b',
  fontSize: '13px',
  fontWeight: 600,
  marginBottom: '6px',
};

// ─── Google Icon ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.99 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.86 3c.9-2.7 3.4-4.46 6.64-4.46z"/>
      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2 3.7-4.96 3.7-8.71z"/>
      <path fill="#FBBC05" d="M5.36 14.5c-.24-.72-.38-1.49-.38-2.5s.14-1.78.38-2.5L1.5 6.5C.54 8.42 0 10.15 0 12s.54 3.58 1.5 5.5l3.86-3z"/>
      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.1.74-2.51 1.18-4.23 1.18-3.24 0-5.74-1.76-6.64-4.46L1.5 17.5C3.39 20.35 7.35 23 12 23z"/>
    </svg>
  );
}

// ─── Eye Icon ─────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ─── Card Shell (Light Theme) ─────────────────────────────────────────────────
function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px 48px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#ffffff',
        border: '1px solid #e8e8e8',
        borderRadius: '16px',
        padding: '40px 36px 28px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Shared Form UI ───────────────────────────────────────────────────────────
function SignUpFormUI({
  formData,
  error,
  loading,
  showPassword,
  onInputChange,
  onSubmit,
  onGoogle,
  onTogglePassword,
}: {
  formData: { firstName: string; lastName: string; email: string; password: string };
  error: string;
  loading: boolean;
  showPassword: boolean;
  onInputChange: (f: string, v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
  onTogglePassword: () => void;
}) {
  return (
    <CardShell>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '26px' }}>
        <h1 style={{ color: '#111111', fontSize: '26px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>Sign Up</h1>
        <p style={{ color: '#888888', fontSize: '13.5px', margin: 0, lineHeight: 1.6 }}>
          Create notes in minutes. No credit card required.
        </p>
      </div>

      {/* Google Button */}
      <button
        onClick={onGoogle}
        style={{
          width: '100%',
          height: '46px',
          backgroundColor: '#ffffff',
          border: '1px solid #d8d8d8',
          borderRadius: '10px',
          color: '#333333',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          cursor: 'pointer',
          transition: 'background-color 0.15s, border-color 0.15s',
          marginBottom: '20px',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#f7f7f7';
          e.currentTarget.style.borderColor = '#c0c0c0';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.borderColor = '#d8d8d8';
        }}
      >
        <GoogleIcon /> Continue with Google
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e8e8e8' }} />
        <span style={{ color: '#aaaaaa', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>OR</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e8e8e8' }} />
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* First + Last Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>First name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={e => onInputChange('firstName', e.target.value)}
              placeholder="Nikhil"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>
          <div>
            <label style={labelStyle}>Last name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={e => onInputChange('lastName', e.target.value)}
              placeholder="Sharma"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={e => onInputChange('email', e.target.value)}
            placeholder="nikhil@example.com"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
          />
        </div>

        {/* Password */}
        <div>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={e => onInputChange('password', e.target.value)}
              placeholder="Choose a password"
              style={{ ...inputStyle, paddingRight: '42px' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#aaaaaa',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>{error}</p>}

        <div id="clerk-captcha" />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            height: '46px',
            backgroundColor: '#9B72F5',
            border: 'none',
            borderRadius: '10px',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.75 : 1,
            transition: 'background-color 0.15s',
            marginTop: '4px',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#8B5CF6'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#9B72F5'; }}
        >
          {loading ? 'Creating account…' : 'Create an account'}
        </button>
      </form>

      {/* Already have account */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>
          Already have an account?{' '}
          <Link href="/signin" style={{ color: '#333333', textDecoration: 'underline', fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>


    </CardShell>
  );
}

// ─── Clerk Sign Up ────────────────────────────────────────────────────────────
function ClerkSignUpForm() {
  const router = useRouter();
  const { login } = useAppStore();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: signInLoaded, signIn } = useSignIn();

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.email,
        password: formData.password,
      });
      if (result.status === 'missing_requirements') {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setVerifying(true);
      } else if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        login({ name: `${formData.firstName} ${formData.lastName}`.trim() || 'User', email: formData.email, streak: 0, plan: 'Free Trial' });
        router.push('/dashboard');
      } else {
        setError(`Registration status: ${result.status}.`);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        login({ name: `${formData.firstName} ${formData.lastName}`.trim() || 'User', email: formData.email, streak: 0, plan: 'Free Trial' });
        router.push('/dashboard');
      } else {
        setError(`Verification status: ${result.status}.`);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Verification failed. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    // Use signIn (not signUp) for Google OAuth — Clerk's signIn flow
    // automatically creates an account if the user doesn't exist yet,
    // and signs in an existing user if they do. signUp.authenticateWithRedirect
    // fails for new users because Google OAuth uses a sign-in code path.
    if (!signInLoaded || !signIn) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err: any) {
      setError(err?.message || err?.longMessage || 'Google sign-up failed. Please try again.');
    }
  };

  if (verifying) {
    return (
      <CardShell>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ color: '#111111', fontSize: '26px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>Verify Email</h1>
          <p style={{ color: '#888888', fontSize: '13.5px', margin: 0, lineHeight: 1.6 }}>
            Enter the 6-digit code sent to <strong style={{ color: '#555' }}>{formData.email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Verification Code</label>
            <input
              type="text"
              required
              maxLength={6}
              value={verificationCode}
              onChange={e => { setVerificationCode(e.target.value); setError(''); }}
              placeholder="123456"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', height: '46px', backgroundColor: '#9B72F5', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#8B5CF6'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#9B72F5'; }}
          >
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => { setVerifying(false); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#888888', textDecoration: 'underline', fontSize: '13px', cursor: 'pointer' }}
          >
            Back to Sign Up
          </button>
        </div>
      </CardShell>
    );
  }

  return (
    <SignUpFormUI
      formData={formData}
      error={error}
      loading={loading}
      showPassword={showPassword}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      onGoogle={handleGoogle}
      onTogglePassword={() => setShowPassword(p => !p)}
    />
  );
}

// ─── Fallback (no Clerk key) ──────────────────────────────────────────────────
function FallbackSignUpForm() {
  const router = useRouter();
  const { login } = useAppStore();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      name: `${formData.firstName.trim() || 'Nikhil'} ${formData.lastName.trim() || 'Sharma'}`,
      email: formData.email || 'nikhil@example.com',
      streak: 12,
      plan: 'Free Trial',
    });
    router.push('/dashboard');
  };

  const handleGoogle = () => {
    login({ name: 'Nikhil Sharma', email: 'nikhil@example.com', streak: 12, plan: 'Free Trial' });
    router.push('/dashboard');
  };

  return (
    <SignUpFormUI
      formData={formData}
      error=""
      loading={false}
      showPassword={showPassword}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      onGoogle={handleGoogle}
      onTogglePassword={() => setShowPassword(p => !p)}
    />
  );
}

// ─── Page Entry Point ─────────────────────────────────────────────────────────
export default function SignUpPage() {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated } = useAppStore();

  useEffect(() => {
    if (hasClerk) {
      if (isLoaded && isSignedIn) router.push('/dashboard');
    } else {
      if (isAuthenticated) router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, isAuthenticated, hasClerk, router]);

  if (hasClerk && isLoaded && isSignedIn) return null;
  if (!hasClerk && isAuthenticated) return null;

  return hasClerk ? <ClerkSignUpForm /> : <FallbackSignUpForm />;
}
