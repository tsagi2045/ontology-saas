'use client';

import dynamic from 'next/dynamic';
import PageLoader from '@/components/ui/PageLoader';

const GraphCanvas = dynamic(() => import('@/components/graph/GraphCanvas'), {
  ssr: false,
  loading: () => <PageLoader text="그래프 로딩 중..." />,
});

export default function GraphPage() {
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <GraphCanvas />
    </div>
  );
}
