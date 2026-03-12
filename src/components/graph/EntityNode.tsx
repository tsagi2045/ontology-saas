'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Entity, OntologyClass } from '@/types';

interface EntityNodeData {
  entity: Entity;
  ontologyClass: OntologyClass;
  isConnected?: boolean;
  isDimmed?: boolean;
  [key: string]: unknown;
}

function EntityNode({ data, selected }: NodeProps & { data: EntityNodeData }) {
  const { entity, ontologyClass, isConnected, isDimmed } = data;
  const color = entity.color || ontologyClass.color || '#6B7280';

  // Three states: selected > connected > dimmed/normal
  const scale = selected ? 'scale-[1.15]' : isConnected ? 'scale-[1.06]' : 'hover:scale-105';
  const opacity = isDimmed ? 'opacity-25' : 'opacity-100';

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-300 ${scale} ${opacity}`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gray-500 !border-0" />

      {/* Selected: strong outer glow ring */}
      {selected && (
        <div
          className="absolute -inset-2 rounded-2xl animate-selected-glow"
          style={{
            background: `radial-gradient(ellipse at center, ${color}25 0%, transparent 70%)`,
            border: `1.5px solid ${color}50`,
          }}
        />
      )}

      {/* Connected: subtle pulse ring */}
      {isConnected && !selected && (
        <div
          className="absolute -inset-1 rounded-xl animate-pulse-ring"
          style={{
            border: `1.5px solid ${color}50`,
          }}
        />
      )}

      <div
        className="px-4 py-3 rounded-xl min-w-[120px] text-center shadow-lg transition-all duration-300"
        style={{
          backgroundColor: selected ? `${color}30` : isConnected ? `${color}18` : `${color}12`,
          border: selected ? `3px solid ${color}` : isConnected ? `2px solid ${color}aa` : `2px solid ${color}35`,
          boxShadow: selected
            ? `0 0 30px ${color}50, 0 0 60px ${color}25, inset 0 0 20px ${color}15`
            : isConnected
            ? `0 0 14px ${color}35`
            : 'none',
        }}
      >
        <div className={`text-xl mb-1 ${selected ? '' : isDimmed ? 'grayscale opacity-50' : ''}`}>{ontologyClass.icon || '📦'}</div>
        <div className={`text-sm font-semibold truncate max-w-[150px] transition-colors duration-300 ${
          selected ? 'text-white' : isDimmed ? 'text-gray-600' : isConnected ? 'text-gray-100' : 'text-white'
        }`}>{entity.name}</div>
        <div className="text-[10px] mt-0.5 truncate transition-colors duration-300" style={{
          color: selected ? color : isDimmed ? '#555' : isConnected ? `${color}cc` : color,
        }}>{ontologyClass.name}</div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gray-500 !border-0" />
    </div>
  );
}

export default memo(EntityNode);
