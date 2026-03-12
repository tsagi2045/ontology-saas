'use client';

import dynamic from 'next/dynamic';

const GraphCanvas = dynamic(() => import('@/components/graph/GraphCanvas'), { ssr: false });

export default function GraphPage() {
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <GraphCanvas />
    </div>
  );
}
