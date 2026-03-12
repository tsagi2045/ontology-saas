'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastItem['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastItem['type'] = 'success', duration = 3000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} item={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), item.duration - 300);
    const removeTimer = setTimeout(() => onRemove(item.id), item.duration);
    return () => { clearTimeout(exitTimer); clearTimeout(removeTimer); };
  }, [item, onRemove]);

  const colors = {
    success: 'border-green-500/50 bg-green-500/10 text-green-400',
    error: 'border-red-500/50 bg-red-500/10 text-red-400',
    info: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
  };

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl min-w-[280px] max-w-[400px] transition-all duration-300 ${colors[item.type]} ${
        exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0 animate-slide-in'
      }`}
    >
      <span className="text-lg font-bold shrink-0">{icons[item.type]}</span>
      <span className="text-sm font-medium">{item.message}</span>
      <button
        onClick={() => onRemove(item.id)}
        className="ml-auto text-gray-500 hover:text-white shrink-0"
      >
        &times;
      </button>
    </div>
  );
}
