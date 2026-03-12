import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutHandlers {
  onNewEntity?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      // Ctrl/Cmd + K → Global search (focus search bar)
      if (isCmd && e.key === 'k') {
        e.preventDefault();
        handlers.onSearch?.();
        // Fallback: focus the header search input
        const searchInput = document.querySelector('header input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Ctrl/Cmd + N → New entity
      if (isCmd && e.key === 'n') {
        e.preventDefault();
        handlers.onNewEntity?.();
      }

      // Delete key (not in input) → Delete selected
      if (e.key === 'Delete' && !isInput) {
        handlers.onDelete?.();
      }

      // Ctrl/Cmd + Z → Undo (handled in undo store)
      // Ctrl/Cmd + Shift + Z → Redo (handled in undo store)

      // Escape → Close modals (handled individually)

      // Ctrl/Cmd + G → Go to graph
      if (isCmd && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        router.push('/graph');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, router]);
}
