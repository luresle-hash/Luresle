import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void; key?: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const config = {
    success: {
      bg: 'bg-green-950/80 border-green-500/50 text-green-200',
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      glow: 'glow-green'
    },
    error: {
      bg: 'bg-red-950/80 border-red-500/50 text-red-200',
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      glow: 'glow-red'
    },
    warning: {
      bg: 'bg-yellow-950/80 border-yellow-500/50 text-yellow-200',
      icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
      glow: 'glow-yellow'
    },
    info: {
      bg: 'bg-zinc-900/90 border-zinc-700/50 text-zinc-200',
      icon: <Info className="w-5 h-5 text-zinc-400" />,
      glow: 'glow-white'
    }
  };

  const current = config[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${current.bg} ${current.glow} backdrop-blur-md animate-fade-in shadow-xl transition-all duration-300`}
      id={`toast-${toast.id}`}
    >
      <div className="flex-shrink-0 mt-0.5">{current.icon}</div>
      <div className="flex-1 text-sm font-sans font-medium text-right leading-relaxed">
        {toast.message}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
