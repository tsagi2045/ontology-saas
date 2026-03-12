'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useToast } from '@/components/ui/Toast';

function UndoRedoHandler() {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      if (!isCmd) return;

      if (e.key === 'z' && !e.shiftKey && canUndo()) {
        e.preventDefault();
        const action = await undo();
        if (action) toast(`실행 취소: ${action.description}`, 'info');
      }
      if ((e.key === 'z' && e.shiftKey || e.key === 'y') && canRedo()) {
        e.preventDefault();
        const action = await redo();
        if (action) toast(`다시 실행: ${action.description}`, 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, toast]);

  return null;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <ToastProvider>
      <ConfirmProvider>
        <UndoRedoHandler />
        <div className="flex min-h-screen">
          {/* Mobile overlay */}
          {mobileMenuOpen && (
            <div className="sidebar-overlay md:hidden" onClick={() => setMobileMenuOpen(false)} />
          )}

          {/* Sidebar */}
          <div className={`
            sidebar-transition
            ${sidebarCollapsed ? 'w-[64px] min-w-[64px]' : 'w-[280px] min-w-[280px]'}
            max-md:fixed max-md:z-50 max-md:h-full
            ${mobileMenuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
            max-md:transition-transform max-md:duration-200
          `}>
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>

          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            <Header
              onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
              sidebarCollapsed={sidebarCollapsed}
            />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
