'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useUser, useAuth } from '@clerk/nextjs';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  Percent,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user: storeUser } = useAppStore();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { getToken } = useAuth();

  // Get plan type from query parameter (default to annual)
  const planParam = searchParams.get('plan') || 'annual';
  const isAnnual = planParam === 'annual';

  // Base Prices
  const baseMonthlyPrice = 199;
  const baseAnnualPrice = 1788; // 149 * 12

  const originalPrice = isAnnual ? baseAnnualPrice : baseMonthlyPrice;
  const planLabel = isAnnual ? 'Pro (Annual)' : 'Pro (Monthly)';
  const planBillingCycle = isAnnual ? 'year' : 'month';

  // Form Fields
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [country, setCountry] = useState('India');
  const [pinCode, setPinCode] = useState('');

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [showPromoInput, setShowPromoInput] = useState(false);

  // Simulation overlays
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  // Sync email from logged-in user
  useEffect(() => {
    if (isClerkLoaded && clerkUser) {
      setEmail(clerkUser.primaryEmailAddress?.emailAddress || '');
    } else if (storeUser) {
      setEmail(storeUser.email || '');
    }
  }, [clerkUser, isClerkLoaded, storeUser]);

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const limited = rawVal.substring(0, 16);
    // Add space every 4 digits
    const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const limited = rawVal.substring(0, 4);
    let formatted = limited;
    if (limited.length > 2) {
      formatted = `${limited.substring(0, 2)}/${limited.substring(2)}`;
    }
    setExpiry(formatted);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setCvc(rawVal.substring(0, 3));
  };

  // Promo Code Validation
  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'AORA20') {
      const discountAmount = Math.round(originalPrice * 0.2);
      setDiscount(discountAmount);
      setAppliedPromo('AORA20 (20% Off)');
      toast('Promo code "AORA20" applied! (20% off)', 'success');
    } else if (code === 'WELCOME') {
      const discountAmount = isAnnual ? 500 : 50;
      setDiscount(discountAmount);
      setAppliedPromo(`WELCOME (₹${discountAmount} Off)`);
      toast(`Promo code "WELCOME" applied! (₹${discountAmount} off)`, 'success');
    } else {
      toast('Invalid promo code. Try "AORA20" or "WELCOME"', 'error');
    }
    setPromoCode('');
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscount(0);
    toast('Promo code removed', 'info');
  };

  // Calculations
  const finalPrice = Math.max(0, originalPrice - discount);

  // Submit Payment Action
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast('Please enter your email', 'error');
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 16) {
      toast('Please enter a valid card number', 'error');
      return;
    }
    if (expiry.length < 5) {
      toast('Please enter a valid expiry date (MM/YY)', 'error');
      return;
    }
    if (cvc.length < 3) {
      toast('Please enter a valid CVC', 'error');
      return;
    }
    if (!cardholderName.trim()) {
      toast('Please enter the cardholder name', 'error');
      return;
    }

    setIsProcessing(true);
    setProcessingStep(0);

    try {
      // Step 1 — Create Razorpay order on backend
      setProcessingStep(1);
      const token = await getToken().catch(() => null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const orderRes = await fetch(`${API_URL}/billing/order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan_type: planParam }),
      });

      if (!orderRes.ok) throw new Error('Failed to create order');
      const orderData = await orderRes.json();

      // Step 2 — Simulate authorization (Razorpay handles real card capture)
      setProcessingStep(2);
      await new Promise((r) => setTimeout(r, 1400));

      // Step 3 — Verify payment signature with backend
      // In a real Razorpay integration the payment_id + signature come from the
      // Razorpay checkout modal callback. We use the order_id as a placeholder
      // for simulation flow (signature check is bypassed server-side in dev mode).
      const verifyRes = await fetch(`${API_URL}/billing/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: orderData.order_id,
          payment_id: `pay_sim_${Date.now()}`,
          signature: 'simulated_signature',
          plan_type: planParam,
        }),
      });

      if (!verifyRes.ok) throw new Error('Payment verification failed');

      setProcessingStep(3);
      // Update plan in Zustand store
      useAppStore.setState((state) => ({
        user: state.user ? { ...state.user, plan: planLabel } : null
      }));

      await new Promise((r) => setTimeout(r, 1500));
      setIsProcessing(false);
      toast(`Thank you! Successfully upgraded to ${planLabel}.`, 'success');
      router.push('/settings');

    } catch (err: any) {
      console.error('Payment error:', err);
      // Fallback: run local simulation if backend is unreachable
      setProcessingStep(2);
      setTimeout(() => {
        setProcessingStep(3);
        useAppStore.setState((state) => ({
          user: state.user ? { ...state.user, plan: planLabel } : null
        }));
      }, 1400);
      setTimeout(() => {
        setIsProcessing(false);
        toast(`Upgraded to ${planLabel} (offline mode).`, 'success');
        router.push('/settings');
      }, 3000);
    }
  };

  // Card Issuer Detection
  const getCardIcon = () => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.startsWith('4')) {
      return (
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded-sm tracking-wide shrink-0">
          VISA
        </span>
      );
    }
    if (raw.startsWith('5')) {
      return (
        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1 rounded-sm tracking-wide shrink-0">
          MC
        </span>
      );
    }
    return <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col md:flex-row relative">

      {/* Simulation Payment Loader Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center"
            >
              {processingStep < 3 ? (
                <div className="w-12 h-12 rounded-full border-4 border-[#7C3AED]/20 border-t-[#7C3AED] animate-spin mb-6" />
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mb-6"
                >
                  <Check className="w-7 h-7 text-emerald-500 stroke-[3]" />
                </motion.div>
              )}

              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {processingStep === 0 && 'Securing Connection...'}
                {processingStep === 1 && 'Connecting to Razorpay...'}
                {processingStep === 2 && 'Authorizing Payment...'}
                {processingStep === 3 && 'Payment Complete!'}
              </h3>
              <p className="text-xs text-gray-400 font-medium px-4">
                {processingStep === 0 && 'Handshaking with payment backend server.'}
                {processingStep === 1 && 'Loading secure checkout page parameters.'}
                {processingStep === 2 && 'Instructing card issuer bank to authorize ₹' + finalPrice.toLocaleString('en-IN') + '.'}
                {processingStep === 3 && 'Your upgrade is active. Redirecting back to settings page.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Column - Order details (Dark Background) */}
      <div className="w-full md:w-[48%] bg-[#0A0A0C] text-white p-8 md:p-16 flex flex-col justify-between min-h-[40vh] md:min-h-screen">

        {/* Top Navigation Back */}
        <div>
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition text-xs font-bold tracking-wide uppercase cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>

        {/* Mid pricing details */}
        <div className="my-10 md:my-auto max-w-sm">
          {/* Logo / Brand header */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 border border-[#8B5CF6]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <span className="text-base font-black font-display tracking-tight text-white">
              aora
            </span>
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
            {planLabel} Subscription
          </p>
          <h1 className="text-4xl md:text-5xl font-black font-display mt-4 tracking-tight leading-none">
            ₹{finalPrice.toLocaleString('en-IN')}.00
            <span className="text-sm font-semibold text-gray-400 font-sans tracking-normal ml-2">
              per {planBillingCycle}
            </span>
          </h1>

          {/* Checkout items summary */}
          <div className="mt-12 space-y-4 border-t border-white/10 pt-6">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 text-[#A78BFA]" />
                </div>
                <span>{planLabel}</span>
              </div>
              <span>₹{originalPrice.toLocaleString('en-IN')}.00</span>
            </div>

            {/* Discount line item */}
            {appliedPromo && (
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                <div className="flex items-center gap-2">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Promo ({appliedPromo})</span>
                </div>
                <span>-₹{discount.toLocaleString('en-IN')}.00</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-bold text-gray-400 pt-2">
              <span>Subtotal</span>
              <span>₹{(originalPrice - discount).toLocaleString('en-IN')}.00</span>
            </div>

            {/* Promotion Code Section */}
            <div className="pt-2">
              {appliedPromo ? (
                <button
                  onClick={handleRemovePromo}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider cursor-pointer"
                >
                  Remove promotion code
                </button>
              ) : showPromoInput ? (
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code (AORA20 / WELCOME)"
                    className="bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none flex-1 font-semibold max-w-[200px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyPromo();
                    }}
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="bg-white text-gray-900 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-gray-100 transition cursor-pointer"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setShowPromoInput(false)}
                    className="text-gray-400 hover:text-white text-xs px-2.5 py-1.5 cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPromoInput(true)}
                  className="text-xs font-bold text-[#8B5CF6] hover:text-[#A78BFA] transition cursor-pointer"
                >
                  Add promotion code
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-sm font-black text-white border-t border-white/10 pt-4 mt-2">
              <span>Total due today</span>
              <span>₹{finalPrice.toLocaleString('en-IN')}.00</span>
            </div>
          </div>
        </div>

        {/* Bottom Lock / Security notice */}
        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-semibold uppercase tracking-wider mt-4">
          <Lock className="w-3 h-3 stroke-[2.5]" />
          <span>Powered by Razorpay Secure Gateway</span>
        </div>

      </div>

      {/* Right Column - Payment Form (Light Background) */}
      <div className="w-full md:w-[52%] bg-white p-8 md:p-16 flex flex-col justify-center min-h-[60vh] md:min-h-screen">
        <div className="max-w-md w-full mx-auto">

          {/* Pay with Razorpay Link button styled premium green */}
          <button
            onClick={handlePayment}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition text-sm shadow-2xs"
          >
            <span>Pay with</span>
            <span className="font-extrabold flex items-center gap-0.5">
              razorpay <span className="bg-white/20 text-[9px] px-1 rounded-sm">link</span>
            </span>
          </button>

          {/* OR Divider */}
          <div className="flex items-center justify-between my-7 text-xs font-bold text-gray-400 tracking-wider">
            <div className="h-[1px] bg-gray-100 flex-1" />
            <span className="px-4">OR</span>
            <div className="h-[1px] bg-gray-100 flex-1" />
          </div>

          {/* Payment Form */}
          <form onSubmit={handlePayment} className="space-y-6">

            {/* Contact Info */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Contact information
              </label>
              <div className="border border-gray-200 focus-within:border-[#7C3AED] focus-within:ring-1 focus-within:ring-[#7C3AED]/20 bg-gray-50/50 rounded-xl px-4 py-3.5 flex items-center justify-between transition-all">
                <span className="text-xs text-gray-400 font-semibold shrink-0 w-12">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-transparent text-xs text-gray-700 outline-none flex-1 font-semibold"
                  required
                />
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Payment method
              </label>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">

                {/* Header Tab - Card (Default Selected) */}
                <div className="bg-gray-50/70 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-xs font-bold text-gray-700">Card</span>
                </div>

                {/* Card input details */}
                <div className="p-4 space-y-4 bg-white">

                  {/* Card Number Input */}
                  <div className="border border-gray-200 focus-within:border-[#7C3AED] focus-within:ring-1 focus-within:ring-[#7C3AED]/20 rounded-lg px-3 py-2.5 flex items-center justify-between transition">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="Card number"
                      className="bg-transparent text-xs text-gray-700 outline-none flex-1 font-semibold tracking-wider"
                      required
                    />
                    {getCardIcon()}
                  </div>

                  {/* Expiry and CVC block */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-gray-200 focus-within:border-[#7C3AED] focus-within:ring-1 focus-within:ring-[#7C3AED]/20 rounded-lg px-3 py-2.5 transition">
                      <input
                        type="text"
                        value={expiry}
                        onChange={handleExpiryChange}
                        placeholder="MM / YY"
                        className="bg-transparent text-xs text-gray-700 outline-none w-full font-semibold"
                        required
                      />
                    </div>
                    <div className="border border-gray-200 focus-within:border-[#7C3AED] focus-within:ring-1 focus-within:ring-[#7C3AED]/20 rounded-lg px-3 py-2.5 transition">
                      <input
                        type="password"
                        value={cvc}
                        onChange={handleCvcChange}
                        placeholder="CVC"
                        className="bg-transparent text-xs text-gray-700 outline-none w-full font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div className="border border-gray-200 focus-within:border-[#7C3AED] focus-within:ring-1 focus-within:ring-[#7C3AED]/20 rounded-lg px-3 py-2.5 transition">
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="Full name on card"
                      className="bg-transparent text-xs text-gray-700 outline-none w-full font-semibold"
                      required
                    />
                  </div>

                  {/* Billing address info */}
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-150">
                    {/* Country select */}
                    <div className="px-3 py-2.5 flex items-center justify-between relative cursor-pointer group bg-gray-50/20">
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="bg-transparent text-xs text-gray-700 outline-none w-full font-semibold cursor-pointer appearance-none pr-8 z-1"
                      >
                        <option value="India">India</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
                    </div>

                    {/* Pin code / ZIP */}
                    <div className="px-3 py-2.5">
                      <input
                        type="text"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        placeholder="PIN code"
                        className="bg-transparent text-xs text-gray-700 outline-none w-full font-semibold"
                        required
                      />
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Pay primary button */}
            <button
              type="submit"
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition text-sm shadow-md"
            >
              <span>Pay ₹{finalPrice.toLocaleString('en-IN')}.00</span>
            </button>

          </form>

        </div>
      </div>

    </div>
  );
}
