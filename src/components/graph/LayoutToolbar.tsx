'use client';

import { useState } from 'react';
import type { LayoutType, LayoutDirection } from '@/lib/layout';

interface LayoutToolbarProps {
  layoutType: LayoutType;
  layoutDirection: LayoutDirection;
  onLayoutChange: (type: LayoutType, direction?: LayoutDirection) => void;
}

const layoutOptions: Array<{
  type: LayoutType;
  label: string;
  icon: string;
  directions?: Array<{ dir: LayoutDirection; label: string; icon: string }>;
}> = [
  {
    type: 'dagre',
    label: '계층형',
    icon: '🔀',
    directions: [
      { dir: 'TB', label: '위→아래', icon: '↓' },
      { dir: 'LR', label: '왼→오른', icon: '→' },
      { dir: 'BT', label: '아래→위', icon: '↑' },
      { dir: 'RL', label: '오른→왼', icon: '←' },
    ],
  },
  {
    type: 'radial',
    label: '방사형',
    icon: '◎',
  },
  {
    type: 'grid',
    label: '그리드',
    icon: '▦',
  },
];

export default function LayoutToolbar({ layoutType, layoutDirection, onLayoutChange }: LayoutToolbarProps) {
  const [expanded, setExpanded] = useState(false);

  const currentOption = layoutOptions.find(o => o.type === layoutType);
  const currentDir = currentOption?.directions?.find(d => d.dir === layoutDirection);

  return (
    <div className="absolute top-3 right-3 z-10">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
        {/* Toggle button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#222] transition-colors w-full"
          title="레이아웃 변경"
        >
          <span>{currentOption?.icon}</span>
          <span className="text-xs font-medium">{currentOption?.label}</span>
          {currentDir && <span className="text-xs text-gray-500">{currentDir.icon}</span>}
          <span className="text-[10px] text-gray-600 ml-1">{expanded ? '▲' : '▼'}</span>
        </button>

        {/* Expanded panel */}
        {expanded && (
          <div className="border-t border-[#2a2a2a] p-2 space-y-1">
            {layoutOptions.map(option => (
              <div key={option.type}>
                {/* Layout type button */}
                {!option.directions ? (
                  <button
                    onClick={() => { onLayoutChange(option.type); setExpanded(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      layoutType === option.type
                        ? 'bg-[#E85D3A]/15 text-[#E85D3A]'
                        : 'text-gray-400 hover:text-white hover:bg-[#222]'
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ) : (
                  <>
                    <div className="px-2.5 py-1 text-[10px] text-gray-600 font-medium uppercase">
                      {option.icon} {option.label}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {option.directions.map(dir => (
                        <button
                          key={dir.dir}
                          onClick={() => { onLayoutChange(option.type, dir.dir); setExpanded(false); }}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            layoutType === option.type && layoutDirection === dir.dir
                              ? 'bg-[#E85D3A]/15 text-[#E85D3A]'
                              : 'text-gray-400 hover:text-white hover:bg-[#222]'
                          }`}
                        >
                          <span className="text-sm">{dir.icon}</span>
                          <span>{dir.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
