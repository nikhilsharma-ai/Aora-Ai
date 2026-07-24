export const getApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (!isLocalhost) {
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('aora-ai-g1g8')) {
        return `${window.location.origin}/api/v1`;
      }
    }
  }
  return envUrl || 'http://localhost:8000/api/v1';
};
