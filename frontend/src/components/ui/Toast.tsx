'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils/classnames';
import { AlertCircle, CheckCircle2, Info, X, Zap } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'score' | 'achievement';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  score: (title: string, message?: string) => void;
  achievement: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast],
  );

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ type: 'error', title, message }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ type: 'info', title, message }), [toast]);
  const score = useCallback((title: string, message?: string) => toast({ type: 'score', title, message, duration: 5000 }), [toast]);
  const achievement = useCallback((title: string, message?: string) => toast({ type: 'achievement', title, message, duration: 6000 }), [toast]);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    error: <AlertCircle className="h-4 w-4 text-red-400" />,
    info: <Info className="h-4 w-4 text-blue-400" />,
    score: <Zap className="h-4 w-4 text-amber-400" />,
    achievement: <Zap className="h-4 w-4 text-purple-400" />,
  };

  const borders = {
    success: 'border-emerald-700/60 bg-emerald-950/90 text-emerald-100',
    error: 'border-red-700/60 bg-red-950/90 text-red-100',
    info: 'border-blue-700/60 bg-blue-950/90 text-blue-100',
    score: 'border-amber-700/60 bg-amber-950/90 text-amber-100',
    achievement: 'border-purple-700/60 bg-purple-950/90 text-purple-100',
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, score, achievement }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start justify-between p-3.5 rounded border shadow-2xl font-mono text-xs animate-in slide-in-from-bottom-5 duration-200',
              borders[t.type],
            )}
          >
            <div className="flex items-start space-x-2.5">
              <div className="mt-0.5">{icons[t.type]}</div>
              <div>
                <div className="font-bold tracking-wide uppercase">{t.title}</div>
                {t.message && <div className="mt-1 text-slate-300 font-normal leading-relaxed">{t.message}</div>}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-3 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
