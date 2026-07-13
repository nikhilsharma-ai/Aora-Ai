'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  return (
    <>
      {/* Spinner shown while Clerk processes the OAuth token */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        fontFamily: "'Inter', sans-serif",
        gap: '16px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e0d7fb',
          borderTop: '3px solid #8B5CF6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#888888', fontSize: '14px', fontWeight: 500, margin: 0 }}>
          Signing you in…
        </p>
      </div>

      {/* Handles both sign-in AND sign-up OAuth callbacks */}
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
      />
    </>
  );
}
