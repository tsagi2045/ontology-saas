'use client';

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';

interface GroupNodeData {
  label: string;
  icon: string;
  color: string;
  count: number;
  width: number;
  height: number;
  [key: string]: unknown;
}

function GroupNode({ data }: NodeProps & { data: GroupNodeData }) {
  const { label, icon, color, count, width, height } = data;

  return (
    <div
      className="rounded-2xl border-2 border-dashed transition-all duration-300"
      style={{
        width,
        height,
        backgroundColor: `${color}08`,
        borderColor: `${color}30`,
      }}
    >
      <div
        className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
        style={{
          backgroundColor: `${color}20`,
          color: `${color}cc`,
          border: `1px solid ${color}30`,
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
        <span className="opacity-60">({count})</span>
      </div>
    </div>
  );
}

export default memo(GroupNode);
