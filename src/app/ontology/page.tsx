'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { OntologyClass, PredicateType } from '@/types';

export default function OntologyPage() {
  const [classes, setClasses] = useState<OntologyClass[]>([]);
  const [predicates, setPredicates] = useState<PredicateType[]>([]);
  const [selectedClass, setSelectedClass] = useState<OntologyClass | null>(null);
  const [activeTab, setActiveTab] = useState<'classes' | 'predicates'>('classes');
  const [showClassModal, setShowClassModal] = useState(false);
  const [showPredicateModal, setShowPredicateModal] = useState(false);
  const [classForm, setClassForm] = useState({ id: '', name: '', parentClassId: '', icon: '', color: '#6B7280', description: '', requiredProperties: '', optionalProperties: '' });
  const [predForm, setPredForm] = useState({ id: '', name: '', inverseId: '', description: '', sourceClassIds: '', targetClassIds: '' });

  const fetchData = () => {
    fetch('/api/classes').then(r => r.json()).then(d => setClasses(d.items));
    fetch('/api/predicates').then(r => r.json()).then(d => setPredicates(d.items));
  };

  useEffect(() => { fetchData(); }, []);

  // Build tree structure
  const buildTree = (parentId?: string): OntologyClass[] => {
    return classes.filter(c => (c.parentClassId || undefined) === parentId);
  };

  const renderTree = (parentId?: string, depth = 0): React.ReactNode => {
    const children = buildTree(parentId);
    if (children.length === 0) return null;
    return children.map(cls => (
      <div key={cls.id}>
        <button
          onClick={() => setSelectedClass(cls)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
            selectedClass?.id === cls.id ? 'bg-[#E85D3A]/10 text-[#E85D3A]' : 'text-gray-300 hover:bg-[#1a1a1a]'
          }`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          <span>{cls.icon || '📦'}</span>
          <span>{cls.name}</span>
          <span className="ml-auto text-xs text-gray-600">{cls.id}</span>
        </button>
        {renderTree(cls.id, depth + 1)}
      </div>
    ));
  };

  const handleSaveClass = async () => {
    const body = {
      id: classForm.id,
      name: classForm.name,
      parentClassId: classForm.parentClassId || null,
      icon: classForm.icon,
      color: classForm.color,
      description: classForm.description,
      requiredProperties: classForm.requiredProperties.split(',').map(s => s.trim()).filter(Boolean),
      optionalProperties: classForm.optionalProperties.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (selectedClass && showClassModal) {
      await fetch(`/api/classes/${classForm.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setShowClassModal(false);
    fetchData();
  };

  const handleSavePredicate = async () => {
    const body = {
      id: predForm.id,
      name: predForm.name,
      inverseId: predForm.inverseId || null,
      description: predForm.description,
      sourceClassIds: predForm.sourceClassIds.split(',').map(s => s.trim()).filter(Boolean),
      targetClassIds: predForm.targetClassIds.split(',').map(s => s.trim()).filter(Boolean),
    };
    await fetch('/api/predicates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowPredicateModal(false);
    fetchData();
  };

  const openEditClass = (cls: OntologyClass) => {
    setClassForm({
      id: cls.id,
      name: cls.name,
      parentClassId: cls.parentClassId || '',
      icon: cls.icon || '',
      color: cls.color,
      description: cls.description || '',
      requiredProperties: cls.requiredProperties.join(', '),
      optionalProperties: cls.optionalProperties.join(', '),
    });
    setShowClassModal(true);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">온톨로지 설계</h1>
        <div className="flex gap-2">
          <Button variant={activeTab === 'classes' ? 'primary' : 'secondary'} onClick={() => setActiveTab('classes')}>클래스</Button>
          <Button variant={activeTab === 'predicates' ? 'primary' : 'secondary'} onClick={() => setActiveTab('predicates')}>술어(관계 유형)</Button>
        </div>
      </div>

      {activeTab === 'classes' ? (
        <div className="grid grid-cols-[300px_1fr] gap-6">
          {/* Class Tree */}
          <Card className="p-3">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-sm font-semibold text-gray-400">클래스 계층</h3>
              <button
                onClick={() => {
                  setSelectedClass(null);
                  setClassForm({ id: '', name: '', parentClassId: '', icon: '', color: '#6B7280', description: '', requiredProperties: '', optionalProperties: '' });
                  setShowClassModal(true);
                }}
                className="text-[#E85D3A] text-xs hover:underline"
              >
                + 추가
              </button>
            </div>
            <div className="space-y-0.5">
              {renderTree(undefined)}
            </div>
          </Card>

          {/* Class Detail */}
          <Card className="p-6">
            {selectedClass ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedClass.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold">{selectedClass.name}</h2>
                      <p className="text-sm text-gray-500">{selectedClass.id}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openEditClass(selectedClass)}>편집</Button>
                </div>

                <div className="w-full h-3 rounded-full" style={{ backgroundColor: selectedClass.color }} />

                {selectedClass.description && (
                  <p className="text-gray-400">{selectedClass.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">필수 속성</h4>
                    <div className="space-y-1">
                      {selectedClass.requiredProperties.map(p => (
                        <Badge key={p} color="#EF4444">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">선택 속성</h4>
                    <div className="space-y-1">
                      {selectedClass.optionalProperties.map(p => (
                        <Badge key={p} color="#6B7280">{p}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedClass.parentClassId && (
                  <div>
                    <span className="text-sm text-gray-500">상위 클래스: </span>
                    <Badge color="#8B5CF6">{classes.find(c => c.id === selectedClass.parentClassId)?.name || selectedClass.parentClassId}</Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">클래스를 선택하세요</div>
            )}
          </Card>
        </div>
      ) : (
        /* Predicates Tab */
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => {
              setPredForm({ id: '', name: '', inverseId: '', description: '', sourceClassIds: '', targetClassIds: '' });
              setShowPredicateModal(true);
            }}>+ 새 술어</Button>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-[#2a2a2a]">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500">ID</th>
                  <th className="text-left px-4 py-3 text-gray-500">이름</th>
                  <th className="text-left px-4 py-3 text-gray-500">출발 클래스</th>
                  <th className="text-left px-4 py-3 text-gray-500">도착 클래스</th>
                  <th className="text-left px-4 py-3 text-gray-500">역관계</th>
                  <th className="text-left px-4 py-3 text-gray-500">설명</th>
                </tr>
              </thead>
              <tbody>
                {predicates.map(p => (
                  <tr key={p.id} className="border-b border-[#222] hover:bg-[#222]">
                    <td className="px-4 py-2 font-mono text-xs text-gray-400">{p.id}</td>
                    <td className="px-4 py-2 text-white font-medium">{p.name}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {p.sourceClassIds.slice(0, 3).map(id => (
                          <Badge key={id} color="#3B82F6">{classes.find(c => c.id === id)?.name || id}</Badge>
                        ))}
                        {p.sourceClassIds.length > 3 && <span className="text-xs text-gray-500">+{p.sourceClassIds.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {p.targetClassIds.slice(0, 3).map(id => (
                          <Badge key={id} color="#22C55E">{classes.find(c => c.id === id)?.name || id}</Badge>
                        ))}
                        {p.targetClassIds.length > 3 && <span className="text-xs text-gray-500">+{p.targetClassIds.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{p.inverseId || '-'}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{p.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Modal */}
      <Modal isOpen={showClassModal} onClose={() => setShowClassModal(false)} title={classForm.id && selectedClass ? '클래스 수정' : '새 클래스 추가'}>
        <div className="space-y-3">
          <Input label="ID" value={classForm.id} onChange={e => setClassForm({ ...classForm, id: e.target.value })} disabled={!!selectedClass && !!classForm.id} />
          <Input label="이름" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} />
          <Select label="상위 클래스" value={classForm.parentClassId} onChange={e => setClassForm({ ...classForm, parentClassId: e.target.value })} options={[{ value: '', label: '없음 (최상위)' }, ...classes.map(c => ({ value: c.id, label: c.name }))]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="아이콘" value={classForm.icon} onChange={e => setClassForm({ ...classForm, icon: e.target.value })} placeholder="📦" />
            <Input label="색상" type="color" value={classForm.color} onChange={e => setClassForm({ ...classForm, color: e.target.value })} />
          </div>
          <Input label="설명" value={classForm.description} onChange={e => setClassForm({ ...classForm, description: e.target.value })} />
          <Input label="필수 속성 (쉼표 구분)" value={classForm.requiredProperties} onChange={e => setClassForm({ ...classForm, requiredProperties: e.target.value })} placeholder="name, phone" />
          <Input label="선택 속성 (쉼표 구분)" value={classForm.optionalProperties} onChange={e => setClassForm({ ...classForm, optionalProperties: e.target.value })} placeholder="email, address" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowClassModal(false)}>취소</Button>
            <Button onClick={handleSaveClass}>저장</Button>
          </div>
        </div>
      </Modal>

      {/* Predicate Modal */}
      <Modal isOpen={showPredicateModal} onClose={() => setShowPredicateModal(false)} title="새 술어 추가">
        <div className="space-y-3">
          <Input label="ID" value={predForm.id} onChange={e => setPredForm({ ...predForm, id: e.target.value })} placeholder="예: works_at" />
          <Input label="이름" value={predForm.name} onChange={e => setPredForm({ ...predForm, name: e.target.value })} placeholder="예: 근무한다" />
          <Input label="역관계 ID" value={predForm.inverseId} onChange={e => setPredForm({ ...predForm, inverseId: e.target.value })} placeholder="선택" />
          <Input label="설명" value={predForm.description} onChange={e => setPredForm({ ...predForm, description: e.target.value })} />
          <Input label="출발 클래스 ID (쉼표 구분)" value={predForm.sourceClassIds} onChange={e => setPredForm({ ...predForm, sourceClassIds: e.target.value })} placeholder="person, team_member" />
          <Input label="도착 클래스 ID (쉼표 구분)" value={predForm.targetClassIds} onChange={e => setPredForm({ ...predForm, targetClassIds: e.target.value })} placeholder="organization, headquarters" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPredicateModal(false)}>취소</Button>
            <Button onClick={handleSavePredicate}>추가</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
