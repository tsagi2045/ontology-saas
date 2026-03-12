'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { OntologyClass, Entity, Relation } from '@/types';

export default function QueryPage() {
  const [classes, setClasses] = useState<OntologyClass[]>([]);
  const [startClassId, setStartClassId] = useState('');
  const [depth, setDepth] = useState(1);
  const [filters, setFilters] = useState<Array<{ type: string; propertyName: string; operator: string; value: string }>>([]);
  const [results, setResults] = useState<{ entities: Entity[]; relations: Relation[] } | null>(null);
  const [naturalQuery, setNaturalQuery] = useState('');

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(d => setClasses(d.items));
  }, []);

  const handleQuery = async () => {
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startClassId, filters, depth }),
    });
    const data = await res.json();
    setResults(data.data);
  };

  const handleNaturalQuery = async () => {
    // Simple pattern matching for natural language
    const q = naturalQuery.toLowerCase();
    let classId = '';
    let propFilters: any[] = [];

    // Match class keywords
    if (q.includes('고객') || q.includes('vip')) classId = 'customer';
    else if (q.includes('시공')) classId = 'project';
    else if (q.includes('사람') || q.includes('직원')) classId = 'person';
    else if (q.includes('서비스') || q.includes('청소')) classId = 'service_type';
    else if (q.includes('조직') || q.includes('팀')) classId = 'organization';

    // Match location filter
    const locationMatch = q.match(/(강남|서초|마포|송파)/);
    if (locationMatch) {
      propFilters.push({ type: 'property', propertyName: 'address', operator: 'contains', value: locationMatch[1] });
    }

    // Match VIP
    if (q.includes('vip')) {
      classId = 'vip_customer';
    }

    if (classId) {
      setStartClassId(classId);
      setFilters(propFilters);
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startClassId: classId, filters: propFilters, depth: 1 }),
      });
      const data = await res.json();
      setResults(data.data);
    }
  };

  const addFilter = () => {
    setFilters([...filters, { type: 'property', propertyName: '', operator: 'eq', value: '' }]);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">그래프 질의</h1>

      {/* Natural Language Query */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">자연어 질의</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={naturalQuery}
            onChange={(e) => setNaturalQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNaturalQuery()}
            placeholder="예: 강남구에 사는 VIP 고객 목록"
            className="flex-1 px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#E85D3A]"
          />
          <Button onClick={handleNaturalQuery}>질의</Button>
        </div>
        <p className="text-xs text-gray-600 mt-2">지원 키워드: 고객, VIP, 시공, 서비스, 팀, 강남/서초/마포/송파</p>
      </Card>

      {/* Structured Query */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">구조화 질의</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Select
              label="시작 클래스"
              value={startClassId}
              onChange={(e) => setStartClassId(e.target.value)}
              options={[{ value: '', label: '선택...' }, ...classes.map(c => ({ value: c.id, label: `${c.icon || ''} ${c.name}` }))]}
            />
            <Select
              label="탐색 깊이"
              value={String(depth)}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              options={[{ value: '0', label: '0 (엔티티만)' }, { value: '1', label: '1홉' }, { value: '2', label: '2홉' }, { value: '3', label: '3홉' }]}
            />
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">필터 조건</span>
              <button onClick={addFilter} className="text-xs text-[#E85D3A] hover:underline">+ 필터 추가</button>
            </div>
            {filters.map((f, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input className="px-2 py-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded text-sm text-white w-32" placeholder="속성명" value={f.propertyName} onChange={e => { const nf = [...filters]; nf[i].propertyName = e.target.value; setFilters(nf); }} />
                <select className="px-2 py-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded text-sm text-white" value={f.operator} onChange={e => { const nf = [...filters]; nf[i].operator = e.target.value; setFilters(nf); }}>
                  <option value="eq">=</option>
                  <option value="contains">포함</option>
                  <option value="gt">&gt;</option>
                  <option value="gte">&gt;=</option>
                  <option value="lt">&lt;</option>
                  <option value="lte">&lt;=</option>
                </select>
                <input className="px-2 py-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded text-sm text-white w-32" placeholder="값" value={f.value} onChange={e => { const nf = [...filters]; nf[i].value = e.target.value; setFilters(nf); }} />
                <button onClick={() => setFilters(filters.filter((_, j) => j !== i))} className="text-red-400 text-xs">삭제</button>
              </div>
            ))}
          </div>

          <Button onClick={handleQuery}>질의 실행</Button>
        </div>
      </Card>

      {/* Results */}
      {results && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            결과: {results.entities.length}개 엔티티, {results.relations.length}개 관계
          </h3>
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-[#2a2a2a]">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-500">이름</th>
                  <th className="text-left px-4 py-2 text-gray-500">클래스</th>
                  <th className="text-left px-4 py-2 text-gray-500">속성</th>
                </tr>
              </thead>
              <tbody>
                {results.entities.map(e => {
                  const cls = classes.find(c => c.id === e.classId);
                  return (
                    <tr key={e.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                      <td className="px-4 py-2 text-white">{e.name}</td>
                      <td className="px-4 py-2"><Badge color={cls?.color}>{cls?.name || e.classId}</Badge></td>
                      <td className="px-4 py-2 text-gray-400 text-xs font-mono">{JSON.stringify(e.properties).slice(0, 80)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
