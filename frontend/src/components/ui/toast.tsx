'use client';

import React, { createRef } from 'react';
import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function useToast() {
  const addToast = useToastStore((state) => state.addToast);
  return {
    toast: (message: string, type: ToastType = 'success') => addToast(message, type),
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
  };
}

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 inset-x-4 md:bottom-6 md:right-6 md:left-auto z-50 flex flex-col gap-2 max-w-[calc(100vw-32px)] md:max-w-md w-full mx-auto md:mx-0 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
            error: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
            info: <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />,
          };

          const borders = {
            success: 'border-emerald-100 bg-emerald-50 text-emerald-900',
            error: 'border-red-100 bg-red-50 text-red-900',
            info: 'border-blue-100 bg-blue-50 text-blue-900',
          };

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto ${borders[t.type]}`}
            >
              {icons[t.type]}
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="text-foreground/45 hover:text-foreground/80 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
