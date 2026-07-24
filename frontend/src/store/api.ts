export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // In production browser, always use relative path /api/v1 to leverage Vercel rewrites
    if (!isLocalhost) {
      return '/api/v1';
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
};
