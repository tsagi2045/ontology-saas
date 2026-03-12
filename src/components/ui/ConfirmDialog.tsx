'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import Button from './Button';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: () => Promise.resolve(false) });

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    options: { title: '', message: '' },
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    state.resolve?.(result);
    setState(prev => ({ ...prev, open: false, resolve: null }));
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => handleClose(false)}
        >
          <div
            className="w-full max-w-sm mx-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#2a2a2a]">
              <h3 className="text-lg font-semibold text-white">{state.options.title}</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-300">{state.options.message}</p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#2a2a2a]">
              <Button variant="secondary" size="sm" onClick={() => handleClose(false)}>
                {state.options.cancelLabel || '취소'}
              </Button>
              <Button
                variant={state.options.variant || 'danger'}
                size="sm"
                onClick={() => handleClose(true)}
              >
                {state.options.confirmLabel || '확인'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
