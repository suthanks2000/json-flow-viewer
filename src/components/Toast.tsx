import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-neutral-900 text-white border-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-200'
              : toast.type === 'error'
              ? 'bg-red-950 text-red-200 border-red-800 dark:bg-red-50 dark:text-red-900 dark:border-red-200'
              : 'bg-neutral-800 text-neutral-100 border-neutral-700 dark:bg-white dark:text-neutral-800 dark:border-neutral-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 dark:text-red-600 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 dark:text-blue-600 shrink-0" />}
          <span>{toast.text}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 p-0.5 rounded hover:bg-white/10 dark:hover:bg-neutral-200/50 transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  );
};
