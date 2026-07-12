'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { Toaster, useToast } from '../ui/toast';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, initializeStore } = useAppStore();
  const { isLoaded, isSignedIn } = useAuth();
  
  const { isUpgradeModalOpen, closeUpgradeModal } = useUIStore();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const { toast } = useToast();

  const handleConfirmUpgrade = () => {
    closeUpgradeModal();
    router.push(`/checkout?plan=${selectedPlan}`);
  };

  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isLandingOrAuthPage = pathname === '/' || pathname === '/signup' || pathname === '/signin' || pathname === '/checkout';

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  useEffect(() => {
    if (isLandingOrAuthPage) return;

    if (hasClerk) {
      if (isLoaded && !isSignedIn) {
        router.push('/signin');
      }
    }
  }, [isLoaded, isSignedIn, hasClerk, isLandingOrAuthPage, router]);

  if (isLandingOrAuthPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  // If loading Clerk on protected route, show loading shell or return null to prevent flash
  if (hasClerk && !isLoaded) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEECF6' }}>
        <p style={{ color: '#6B6B8A', fontSize: '14px', fontWeight: 600 }}>Loading Aora...</p>
      </div>
    );
  }

  if (hasClerk && !isSignedIn) {
    return null; // Will redirect
  }

  const isWorkspace = pathname.startsWith('/notes');

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative', minWidth: 0 }}>
        {!isWorkspace && <Navbar />}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isWorkspace ? '0' : '28px 32px',
          outline: 'none',
          backgroundColor: 'var(--background)'
        }}>
          {children}
        </main>
      </div>
      <Toaster />

      {/* Global Upgrade Modal Popup */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeUpgradeModal}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl relative w-full max-w-[460px] p-8 overflow-hidden z-10 text-center"
            >
              {/* Close Button */}
              <button
                onClick={closeUpgradeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer p-1 rounded-full hover:bg-gray-50 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-extrabold font-display text-gray-800 tracking-tight leading-tight mt-2 mb-6">
                Unlock Everything with Pro
              </h2>

              {/* Bullet Features */}
              <div className="space-y-3.5 text-left px-2">
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    <span className="text-gray-700 font-bold">Unlimited notes</span> — 2 hour lecture &rarr; done in minutes
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    <span className="text-gray-700 font-bold">Unlimited practice exams</span> — Keep practicing until you're perfect
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    <span className="text-gray-700 font-bold">AI tutor 24/7</span> — Get real help on what matters
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    <span className="text-gray-700 font-bold">Unlimited study podcasts</span> — Review material between classes
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    <span className="text-gray-700 font-bold">Download PDFs</span> — Export summaries and notes locally (Pro only)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    <span className="text-gray-700 font-bold">Faster AI</span> — Polish notes in seconds, not hours
                  </p>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 gap-4 mt-7">
                {/* Annual option */}
                <div
                  onClick={() => setSelectedPlan('annual')}
                  className={`relative border rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col justify-center items-center ${
                    selectedPlan === 'annual'
                      ? 'border-emerald-500 bg-[#E8F8F0] shadow-2xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Purple Floating Badge */}
                  <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-[#EAE6F4] text-[#7C3AED] border border-[#DDD6FE] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                    25% off
                  </div>
                  
                  <span className="text-xs font-bold text-gray-700 mt-1">Annual</span>
                  <span className="text-lg md:text-xl font-bold font-display text-gray-800 mt-1.5 leading-none">
                    ₹149.00 <span className="text-[10px] text-gray-400 font-medium font-sans">/ mo</span>
                  </span>
                  <span className="text-[8.5px] text-gray-400 font-bold mt-2 whitespace-nowrap">
                    billed yearly · ₹4.97/day
                  </span>
                </div>

                {/* Monthly option */}
                <div
                  onClick={() => setSelectedPlan('monthly')}
                  className={`relative border rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col justify-center items-center ${
                    selectedPlan === 'monthly'
                      ? 'border-emerald-500 bg-[#E8F8F0] shadow-2xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-xs font-bold text-gray-700">Monthly</span>
                  <span className="text-lg md:text-xl font-bold font-display text-gray-800 mt-1.5 leading-none">
                    ₹199.00 <span className="text-[10px] text-gray-400 font-medium font-sans">/ mo</span>
                  </span>
                  <span className="text-[8.5px] text-gray-400 font-bold mt-2 whitespace-nowrap">
                    billed monthly · ₹6.63/day
                  </span>
                </div>
              </div>

              {/* Upgrade Now button */}
              <button
                onClick={handleConfirmUpgrade}
                className="w-full bg-[#EAE6F4] hover:bg-[#DCD5F9] text-[#7C3AED] font-bold py-3.5 rounded-2xl border border-purple-100 flex items-center justify-center gap-2 cursor-pointer transition mt-6 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade Now</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
