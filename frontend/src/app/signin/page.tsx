'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useSignIn } from '@clerk/nextjs/legacy';
import { useAuth } from '@clerk/nextjs';

// ─── Shared Styles (Light Theme) ─────────────────────────────────────────────
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

// ─── Back Arrow Icon ──────────────────────────────────────────────────────────
function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5"/>
      <path d="M12 19l-7-7 7-7"/>
    </svg>
  );
}

// ─── Lock Icon ────────────────────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// ─── Mail Icon ────────────────────────────────────────────────────────────────
function MailIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
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
        padding: '40px 36px 32px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Clerk-powered Sign In ────────────────────────────────────────────────────
type Step = 'signin' | 'forgot-password' | 'reset-password';

function ClerkSignInForm() {
  const router = useRouter();
  const { login } = useAppStore();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [step, setStep] = useState<Step>('signin');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const clearError = () => setError('');

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: formData.email, password: formData.password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        login({ name: 'User', email: formData.email, streak: 0, plan: 'Free Trial' });
        router.push('/dashboard');
      } else {
        setError(`Sign-in status: ${result.status}. Additional verification may be required.`);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!isLoaded || !signIn) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err: any) {
      setError(err?.message || err?.longMessage || 'Google sign-in failed. Please try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError('');
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: resetEmail });
      setStep('reset-password');
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Could not send reset email. Please try again.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        login({ name: 'User', email: resetEmail, streak: 0, plan: 'Free Trial' });
        router.push('/dashboard');
      } else {
        setError(`Reset status: ${result.status}. Please try again.`);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Invalid code or password. Please try again.');
    }
    setLoading(false);
  };

  const goBackToSignIn = () => { setStep('signin'); setError(''); setResetCode(''); setNewPassword(''); };

  // ── Forgot Password View ───────────────────────────────────────────────────
  if (step === 'forgot-password') {
    return (
      <CardShell>
        <button
          onClick={goBackToSignIn}
          style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: 0, marginBottom: '24px', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#333333')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
        >
          <BackArrowIcon /> Back to Login
        </button>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#f0edfb', border: '1px solid #d4c8f8', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <MailIcon />
          </div>
          <h1 style={{ color: '#111111', fontSize: '24px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>Forgot Password?</h1>
          <p style={{ color: '#888888', fontSize: '13.5px', margin: 0, lineHeight: 1.6 }}>
            Enter your email and we&apos;ll send you a reset code.
          </p>
        </div>
        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Email address</label>
            <input type="email" required value={resetEmail} onChange={e => { setResetEmail(e.target.value); clearError(); }} placeholder="nikhil@example.com" style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')} />
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0, padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', height: '46px', backgroundColor: '#9B72F5', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1, transition: 'background-color 0.15s' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#8B5CF6'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#9B72F5'; }}>
            {loading ? 'Sending code…' : 'Send Reset Code'}
          </button>
        </form>
      </CardShell>
    );
  }

  // ── Reset Password View ────────────────────────────────────────────────────
  if (step === 'reset-password') {
    return (
      <CardShell>
        <button
          onClick={() => { setStep('forgot-password'); setError(''); setResetCode(''); setNewPassword(''); }}
          style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: 0, marginBottom: '24px', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#333333')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
        >
          <BackArrowIcon /> Back
        </button>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#f0edfb', border: '1px solid #d4c8f8', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <LockIcon />
          </div>
          <h1 style={{ color: '#111111', fontSize: '24px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>Reset Password</h1>
          <p style={{ color: '#888888', fontSize: '13.5px', margin: 0, lineHeight: 1.6 }}>
            Enter the code sent to <span style={{ color: '#8B5CF6', fontWeight: 600 }}>{resetEmail}</span> and your new password.
          </p>
        </div>
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Verification Code</label>
            <input type="text" required maxLength={6} value={resetCode}
              onChange={e => { setResetCode(e.target.value.replace(/\D/g, '')); clearError(); }}
              placeholder="123456"
              style={{ ...inputStyle, letterSpacing: '0.25em', fontSize: '18px', textAlign: 'center' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')} />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNewPassword ? 'text' : 'password'} required minLength={8} value={newPassword}
                onChange={e => { setNewPassword(e.target.value); clearError(); }}
                placeholder="Enter new password"
                style={{ ...inputStyle, paddingRight: '40px' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')} />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaaaaa', padding: 0, display: 'flex', alignItems: 'center' }}>
                <EyeIcon open={showNewPassword} />
              </button>
            </div>
            <p style={{ color: '#aaaaaa', fontSize: '11px', margin: '5px 0 0' }}>Must be at least 8 characters</p>
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0, padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', height: '46px', backgroundColor: '#9B72F5', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1, transition: 'background-color 0.15s' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#8B5CF6'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#9B72F5'; }}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </CardShell>
    );
  }

  // ── Default Sign In View ───────────────────────────────────────────────────
  return (
    <CardShell>
      <div style={{ textAlign: 'center', marginBottom: '26px' }}>
        <h1 style={{ color: '#111111', fontSize: '26px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>Login</h1>
        <p style={{ color: '#888888', fontSize: '13.5px', margin: 0, lineHeight: 1.6 }}>
          Create notes in minutes. No credit card required.
        </p>
      </div>

      <button
        onClick={handleGoogleLogin}
        style={{ width: '100%', height: '46px', backgroundColor: '#ffffff', border: '1px solid #d8d8d8', borderRadius: '10px', color: '#333333', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'background-color 0.15s, border-color 0.15s', marginBottom: '20px' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f7f7f7'; e.currentTarget.style.borderColor = '#c0c0c0'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#d8d8d8'; }}
      >
        <GoogleIcon /> Continue with Google
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e8e8e8' }} />
        <span style={{ color: '#aaaaaa', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>OR</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e8e8e8' }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Email */}
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" required value={formData.email}
            onChange={e => handleInputChange('email', e.target.value)}
            placeholder="nikhil@example.com" style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')} />
        </div>

        {/* Password */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <button
              type="button"
              onClick={() => { setResetEmail(formData.email); setStep('forgot-password'); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#888888', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#8B5CF6')}
              onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
            >
              Forgot password?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} required value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              style={{ ...inputStyle, paddingRight: '40px' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaaaaa', padding: 0, display: 'flex', alignItems: 'center' }}>
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0, padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>{error}</p>}

        <button type="submit" disabled={loading}
          style={{ width: '100%', height: '46px', backgroundColor: '#9B72F5', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1, transition: 'background-color 0.15s', marginTop: '4px' }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#8B5CF6'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#9B72F5'; }}>
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#333333', textDecoration: 'underline', fontWeight: 500 }}>Sign up</Link>
        </p>
      </div>
    </CardShell>
  );
}

// ─── Fallback (no Clerk key) ──────────────────────────────────────────────────
function FallbackSignInForm() {
  const router = useRouter();
  const { login } = useAppStore();
  const [step, setStep] = useState<Step>('signin');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearError = () => setError('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ name: 'Nikhil Sharma', email: formData.email || 'nikhil@example.com', streak: 12, plan: 'Free Trial' });
    router.push('/dashboard');
  };

  const handleGoogleLogin = () => {
    login({ name: 'Nikhil Sharma', email: 'nikhil@example.com', streak: 12, plan: 'Free Trial' });
    router.push('/dashboard');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('reset-password'); }, 800);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode !== '123456') { setError('Invalid code. Use 123456 in demo mode.'); return; }
    setLoading(true);
    setTimeout(() => {
      login({ name: 'Nikhil Sharma', email: resetEmail || 'nikhil@example.com', streak: 12, plan: 'Free Trial' });
      router.push('/dashboard');
    }, 800);
  };

  const goBackToSignIn = () => { setStep('signin'); setError(''); setResetCode(''); setNewPassword(''); };

  if (step === 'forgot-password') {
    return (
      <CardShell>
        <button onClick={goBackToSignIn}
          style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: 0, marginBottom: '24px' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#333333')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888888')}>
          <BackArrowIcon /> Back to Login
        </button>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#f0edfb', border: '1px solid #d4c8f8', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <MailIcon />
          </div>
          <h1 style={{ color: '#111111', fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>Forgot Password?</h1>
          <p style={{ color: '#888888', fontSize: '13.5px', margin: 0 }}>Enter your email and we&apos;ll send you a reset code.</p>
          <p style={{ color: '#8B5CF6', fontSize: '12px', marginTop: '8px', marginBottom: 0 }}>Demo mode: use code <strong>123456</strong></p>
        </div>
        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Email address</label>
            <input type="email" required value={resetEmail} onChange={e => { setResetEmail(e.target.value); clearError(); }} placeholder="nikhil@example.com" style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')} />
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0, padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', height: '46px', backgroundColor: '#9B72F5', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#8B5CF6'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#9B72F5'; }}>
            {loading ? 'Sending…' : 'Send Reset Code'}
          </button>
        </form>
      </CardShell>
    );
  }

  if (step === 'reset-password') {
    return (
      <CardShell>
        <button onClick={() => { setStep('forgot-password'); setError(''); setResetCode(''); setNewPassword(''); }}
          style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: 0, marginBottom: '24px' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#333333')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888888')}>
          <BackArrowIcon /> Back
        </button>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#f0edfb', border: '1px solid #d4c8f8', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <LockIcon />
          </div>
          <h1 style={{ color: '#111111', fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>Reset Password</h1>
          <p style={{ color: '#888888', fontSize: '13.5px', margin: 0 }}>
            Enter the code sent to <span style={{ color: '#8B5CF6', fontWeight: 600 }}>{resetEmail}</span> and your new password.
          </p>
        </div>
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Verification Code</label>
            <input type="text" required maxLength={6} value={resetCode} onChange={e => { setResetCode(e.target.value.replace(/\D/g, '')); clearError(); }} placeholder="123456"
              style={{ ...inputStyle, letterSpacing: '0.25em', fontSize: '18px', textAlign: 'center' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')} />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNewPassword ? 'text' : 'password'} required minLength={8} value={newPassword} onChange={e => { setNewPassword(e.target.value); clearError(); }} placeholder="Enter new password"
                style={{ ...inputStyle, paddingRight: '40px' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')} />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaaaaa', padding: 0, display: 'flex', alignItems: 'center' }}>
                <EyeIcon open={showNewPassword} />
              </button>
            </div>
            <p style={{ color: '#aaaaaa', fontSize: '11px', margin: '5px 0 0' }}>Must be at least 8 characters</p>
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0, padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', height: '46px', backgroundColor: '#9B72F5', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#8B5CF6'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#9B72F5'; }}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </CardShell>
    );
  }

  return (
    <CardShell>
      <div style={{ textAlign: 'center', marginBottom: '26px' }}>
        <h1 style={{ color: '#111111', fontSize: '26px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>Login</h1>
        <p style={{ color: '#888888', fontSize: '13.5px', margin: 0, lineHeight: 1.6 }}>Create notes in minutes. No credit card required.</p>
      </div>
      <button onClick={handleGoogleLogin}
        style={{ width: '100%', height: '46px', backgroundColor: '#ffffff', border: '1px solid #d8d8d8', borderRadius: '10px', color: '#333333', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'background-color 0.15s', marginBottom: '20px' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f7f7f7'; e.currentTarget.style.borderColor = '#c0c0c0'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#d8d8d8'; }}>
        <GoogleIcon /> Continue with Google
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e8e8e8' }} />
        <span style={{ color: '#aaaaaa', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>OR</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e8e8e8' }} />
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="nikhil@example.com" style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <button type="button" onClick={() => { setResetEmail(formData.email); setStep('forgot-password'); clearError(); }}
              style={{ background: 'none', border: 'none', color: '#888888', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#8B5CF6')}
              onMouseLeave={e => (e.currentTarget.style.color = '#888888')}>
              Forgot password?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
              style={{ ...inputStyle, paddingRight: '40px' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaaaaa', padding: 0, display: 'flex', alignItems: 'center' }}>
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>
        <button type="submit"
          style={{ width: '100%', height: '46px', backgroundColor: '#9B72F5', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.15s', marginTop: '4px' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#8B5CF6')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#9B72F5')}>
          Login
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ color: '#888888', fontSize: '13px', margin: 0 }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#333333', textDecoration: 'underline', fontWeight: 500 }}>Sign up</Link>
        </p>
      </div>
    </CardShell>
  );
}

// ─── Page Entry Point ─────────────────────────────────────────────────────────
export default function SignInPage() {
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

  return hasClerk ? <ClerkSignInForm /> : <FallbackSignInForm />;
}
