import { clerkMiddleware } from '@clerk/nextjs/server';

// Minimal middleware — just makes Clerk auth available to all pages.
// Route protection is handled client-side in each page's useEffect.
const clerkProxy = clerkMiddleware();

export { clerkProxy as default, clerkProxy as proxy };

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
