'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '대시보드', icon: '📊' },
  { href: '/graph', label: '지식 그래프', icon: '🕸️' },
  { href: '/entities', label: '엔티티 관리', icon: '📦' },
  { href: '/ontology', label: '온톨로지 설계', icon: '🏗️' },
  { href: '/rules', label: '추론 규칙', icon: '⚡' },
  { href: '/query', label: '그래프 질의', icon: '🔍' },
  { href: '/import', label: '데이터 임포트', icon: '📥' },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="h-full bg-[#111] border-r border-[#2a2a2a] flex flex-col sidebar-transition overflow-hidden">
      {/* Logo */}
      <div className={`px-4 py-5 border-b border-[#2a2a2a] ${collapsed ? 'px-2' : 'px-6'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E85D3A] flex items-center justify-center text-white font-bold text-lg shrink-0">K</div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-white font-bold text-base leading-tight whitespace-nowrap">Knowledge Graph</h1>
              <p className="text-gray-500 text-xs whitespace-nowrap">Ontology SaaS</p>
            </div>
          )}
        </div>
      </div>

      {/* Workspace */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-[#2a2a2a]">
          <div className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
            <p className="text-xs text-gray-500">워크스페이스</p>
            <p className="text-sm text-white font-medium">BROS 청소업체</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm transition-all duration-200 ${
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-[#E85D3A]/10 text-[#E85D3A] font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-2 border-t border-[#2a2a2a]">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors text-xs"
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          <span className="text-sm">{collapsed ? '▶' : '◀'}</span>
          {!collapsed && <span>사이드바 접기</span>}
        </button>
      </div>

      {/* Footer */}
      <div className={`py-4 border-t border-[#2a2a2a] ${collapsed ? 'px-2' : 'px-4'}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-3'}`}>
          <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm shrink-0">👤</div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm text-white truncate">관리자</p>
              <p className="text-xs text-gray-500 truncate">admin@bros.kr</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
