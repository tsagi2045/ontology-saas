'use client';

import { useEffect, useRef, useState } from 'react';
import Card from '@/components/ui/Card';
import PageLoader from '@/components/ui/PageLoader';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

interface DashboardData {
  stats: { entityCount: number; relationCount: number; classCount: number; activeRuleCount: number };
  classDistribution: Array<{ name: string; color: string; count: number }>;
  recentEntities: Array<{ id: string; name: string; className: string; classIcon: string; createdAt: string }>;
  recentLogs: Array<{ id: string; rule_name: string; affected_entity_name: string; action_summary: string; executed_at: string }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData);
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setChartWidth(entry.contentRect.width);
      }
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, [data]);

  if (!data) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="h-8 w-32 bg-[#1a1a1a] rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#1a1a1a] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-[#1a1a1a] rounded-xl animate-pulse" />
          <div className="h-96 bg-[#1a1a1a] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: '엔티티', value: data.stats.entityCount, icon: '📦', color: '#3B82F6' },
    { label: '관계', value: data.stats.relationCount, icon: '🔗', color: '#22C55E' },
    { label: '클래스', value: data.stats.classCount, icon: '🏗️', color: '#8B5CF6' },
    { label: '활성 규칙', value: data.stats.activeRuleCount, icon: '⚡', color: '#F59E0B' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">대시보드</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{card.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">클래스별 엔티티 분포</h3>
          <div ref={chartRef}>
            {chartWidth > 0 && data.classDistribution.length > 0 ? (
              <PieChart width={chartWidth} height={256}>
                <Pie
                  data={data.classDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="count"
                  nameKey="name"
                  stroke="#0f0f0f"
                  strokeWidth={2}
                >
                  {data.classDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: any, name: any) => [`${value}개`, name]}
                />
              </PieChart>
            ) : data.classDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500 text-sm">데이터 없음</div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {data.classDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                {item.name} ({item.count})
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Entities */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">최근 엔티티</h3>
          <div className="space-y-3">
            {data.recentEntities.map(entity => (
              <div key={entity.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{entity.classIcon}</span>
                  <div>
                    <p className="text-sm text-white font-medium">{entity.name}</p>
                    <p className="text-xs text-gray-500">{entity.className}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Inference Logs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">최근 추론 실행 로그</h3>
        {data.recentLogs.length === 0 ? (
          <p className="text-gray-500 text-sm">아직 실행된 추론 규칙이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {data.recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
                <div>
                  <p className="text-sm text-white">{log.rule_name}</p>
                  <p className="text-xs text-gray-500">{log.affected_entity_name} — {log.action_summary}</p>
                </div>
                <p className="text-xs text-gray-600">{log.executed_at}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
