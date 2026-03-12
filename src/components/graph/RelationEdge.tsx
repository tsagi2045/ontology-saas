'use client';

import { memo, useId } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import type { Relation, PredicateType } from '@/types';

interface RelationEdgeData {
  relation: Relation;
  predicate: PredicateType;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  [key: string]: unknown;
}

function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
  markerEnd,
}: EdgeProps & { data: RelationEdgeData }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const markerId = useId().replace(/:/g, '');
  const isInferred = data?.relation?.properties?.inferred === true;
  const isHighlighted = data?.isHighlighted === true;
  const isDimmed = data?.isDimmed === true;
  const label = data?.predicate?.name || '';

  let strokeColor: string;
  let strokeW: number;
  let opacity: number;

  if (selected) {
    strokeColor = '#E85D3A';
    strokeW = 3;
    opacity = 1;
  } else if (isHighlighted) {
    strokeColor = isInferred ? '#a78bfa' : '#aaa';
    strokeW = 2.5;
    opacity = 1;
  } else if (isDimmed) {
    strokeColor = isInferred ? '#8B5CF6' : '#4a4a4a';
    strokeW = 1.5;
    opacity = 0.12;
  } else {
    strokeColor = isInferred ? '#8B5CF6' : '#4a4a4a';
    strokeW = 1.5;
    opacity = 1;
  }

  const showFlowAnimation = isHighlighted || selected;

  return (
    <>
      {/* Custom arrow marker for highlighted edges */}
      {showFlowAnimation && (
        <defs>
          <marker
            id={`arrow-${markerId}`}
            viewBox="0 0 14 14"
            refX="12"
            refY="7"
            markerWidth="12"
            markerHeight="12"
            orient="auto-start-reverse"
          >
            <path
              d="M 2 3 L 12 7 L 2 11 z"
              fill={strokeColor}
            />
          </marker>
        </defs>
      )}

      {/* Base edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={showFlowAnimation ? `url(#arrow-${markerId})` : markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: strokeW,
          strokeDasharray: isInferred && !showFlowAnimation ? '5 5' : undefined,
          opacity,
          transition: 'opacity 0.3s, stroke 0.3s, stroke-width 0.3s',
        }}
      />

      {/* Animated flowing dashes overlay for highlighted edges */}
      {showFlowAnimation && (
        <path
          d={edgePath}
          fill="none"
          stroke={selected ? '#E85D3A' : 'white'}
          strokeWidth={strokeW}
          strokeDasharray="8 16"
          strokeLinecap="round"
          opacity={selected ? 0.6 : 0.4}
          className="animate-edge-flow"
        />
      )}

      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-auto cursor-pointer"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              opacity: isDimmed ? 0.12 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                selected
                  ? 'bg-[#E85D3A]/25 text-[#E85D3A] border border-[#E85D3A]/50'
                  : isHighlighted
                  ? 'bg-[#2a2a2a] text-gray-100 border border-[#666]'
                  : isInferred
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  : 'bg-[#1a1a1a]/90 text-gray-400 border border-[#2a2a2a]'
              }`}
            >
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(RelationEdge);
