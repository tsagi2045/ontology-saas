'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUndoRedo } from '@/hooks/useUndoRedo';

interface HeaderProps {
  onMenuToggle?: () => void;
  sidebarCollapsed?: boolean;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { canUndo, canRedo, undo, redo, undoStack, redoStack } = useUndoRedo();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/entities?search=${encodeURIComponent(search.trim())}`);
    }
  };

  // Focus search on Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="h-14 bg-[#111] border-b border-[#2a2a2a] flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="md:hidden text-gray-400 hover:text-white mr-3 text-lg"
      >
        ☰
      </button>

      <div className="flex items-center gap-4">
        <h2 className="text-white font-medium text-sm hidden sm:block">BROS 청소업체</h2>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 md:mx-8">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="엔티티 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-16 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E85D3A] transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 bg-[#2a2a2a] px-1.5 py-0.5 rounded hidden sm:inline">
            ⌘K
          </kbd>
        </div>
      </form>

      <div className="flex items-center gap-1">
        {/* Undo/Redo buttons */}
        <button
          onClick={() => canUndo() && undo()}
          disabled={!canUndo()}
          title={`실행 취소 (⌘Z)${undoStack.length > 0 ? ` — ${undoStack[undoStack.length - 1].description}` : ''}`}
          className="p-1.5 rounded-md text-sm disabled:opacity-20 text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
        >
          ↩
        </button>
        <button
          onClick={() => canRedo() && redo()}
          disabled={!canRedo()}
          title={`다시 실행 (⌘⇧Z)${redoStack.length > 0 ? ` — ${redoStack[redoStack.length - 1].description}` : ''}`}
          className="p-1.5 rounded-md text-sm disabled:opacity-20 text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
        >
          ↪
        </button>

        <div className="w-px h-5 bg-[#2a2a2a] mx-1 hidden sm:block" />

        <button
          onClick={() => window.open('/api/export/json', '_blank')}
          className="text-gray-400 hover:text-white transition-colors text-sm p-1.5 rounded-md hover:bg-[#1a1a1a] hidden sm:block"
          title="JSON 익스포트"
        >
          📥
        </button>
      </div>
    </header>
  );
}
