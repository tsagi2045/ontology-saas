'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { Entity, OntologyClass } from '@/types';

export default function EntitiesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full min-h-[400px] text-gray-500">로딩 중...</div>}>
      <EntitiesPageInner />
    </Suspense>
  );
}

function EntitiesPageInner() {
  const searchParams = useSearchParams();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [classes, setClasses] = useState<OntologyClass[]>([]);
  const [activeClassTab, setActiveClassTab] = useState<string>('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 300);
  const [showModal, setShowModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [form, setForm] = useState({ name: '', classId: '', description: '', properties: '{}' });
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { push: pushUndo } = useUndoRedo();

  const fetchEntities = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeClassTab) params.set('classId', activeClassTab);
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('pageSize', '200');
    const res = await fetch(`/api/entities?${params}`);
    const data = await res.json();
    setEntities(data.items);
  }, [activeClassTab, debouncedSearch]);

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(d => setClasses(d.items));
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const rootClasses = classes.filter(c => !c.parentClassId);

  const openAddModal = useCallback(() => {
    setEditingEntity(null);
    setForm({ name: '', classId: classes[0]?.id || '', description: '', properties: '{}' });
    setShowModal(true);
  }, [classes]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewEntity: openAddModal,
  });

  const openEditModal = (entity: Entity) => {
    setEditingEntity(entity);
    setForm({
      name: entity.name,
      classId: entity.classId,
      description: entity.description || '',
      properties: JSON.stringify(entity.properties, null, 2),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast('이름을 입력해주세요.', 'warning');
      return;
    }

    let props = {};
    try { props = JSON.parse(form.properties); } catch {
      toast('속성 JSON 형식이 올바르지 않습니다.', 'error');
      return;
    }

    if (editingEntity) {
      const prevData = { ...editingEntity };
      await fetch(`/api/entities/${editingEntity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, classId: form.classId, description: form.description, properties: props }),
      });
      toast(`"${form.name}" 수정 완료`, 'success');

      pushUndo({
        description: `"${form.name}" 엔티티 수정`,
        undo: async () => {
          await fetch(`/api/entities/${editingEntity.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: prevData.name, classId: prevData.classId, description: prevData.description, properties: prevData.properties }),
          });
          fetchEntities();
        },
        redo: async () => {
          await fetch(`/api/entities/${editingEntity.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: form.name, classId: form.classId, description: form.description, properties: props }),
          });
          fetchEntities();
        },
      });
    } else {
      const res = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, classId: form.classId, description: form.description, properties: props }),
      });
      const data = await res.json();
      toast(`"${form.name}" 생성 완료`, 'success');

      pushUndo({
        description: `"${form.name}" 엔티티 생성`,
        undo: async () => {
          await fetch(`/api/entities/${data.data.id}`, { method: 'DELETE' });
          fetchEntities();
        },
        redo: async () => {
          await fetch('/api/entities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: form.name, classId: form.classId, description: form.description, properties: props }),
          });
          fetchEntities();
        },
      });
    }
    setShowModal(false);
    fetchEntities();
  };

  const handleDelete = async (id: string) => {
    const entity = entities.find(e => e.id === id);
    if (!entity) return;

    const confirmed = await confirm({
      title: '엔티티 삭제',
      message: `"${entity.name}" 엔티티를 삭제하시겠습니까? 연결된 관계도 함께 삭제됩니다.`,
      confirmLabel: '삭제',
      variant: 'danger',
    });
    if (!confirmed) return;

    await fetch(`/api/entities/${id}`, { method: 'DELETE' });
    toast(`"${entity.name}" 삭제 완료`, 'success');

    pushUndo({
      description: `"${entity.name}" 엔티티 삭제`,
      undo: async () => {
        await fetch('/api/entities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: entity.name, classId: entity.classId, description: entity.description, properties: entity.properties }),
        });
        fetchEntities();
      },
      redo: async () => {
        // Re-delete by name match (id may differ)
        const res = await fetch(`/api/entities?search=${encodeURIComponent(entity.name)}&pageSize=1`);
        const data = await res.json();
        if (data.items[0]) {
          await fetch(`/api/entities/${data.items[0].id}`, { method: 'DELETE' });
        }
        fetchEntities();
      },
    });
    fetchEntities();
  };

  const getClassInfo = (classId: string) => classes.find(c => c.id === classId);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl md:text-2xl font-bold">엔티티 관리</h1>
        <div className="flex items-center gap-2">
          <Button onClick={openAddModal}>
            <span className="hidden sm:inline">+ 새 엔티티</span>
            <span className="sm:hidden">+</span>
          </Button>
          <kbd className="text-[10px] text-gray-600 bg-[#2a2a2a] px-1.5 py-0.5 rounded hidden md:inline">⌘N</kbd>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="이름으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white w-full max-w-xs focus:outline-none focus:border-[#E85D3A]"
        />
        {debouncedSearch !== search && (
          <span className="text-xs text-gray-600 animate-pulse">검색 중...</span>
        )}
      </div>

      {/* Class Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveClassTab('')}
          className={`px-3 py-1 rounded-lg text-xs transition-colors ${
            !activeClassTab ? 'bg-[#E85D3A] text-white' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
          }`}
        >
          전체
        </button>
        {rootClasses.map(cls => (
          <button
            key={cls.id}
            onClick={() => setActiveClassTab(cls.id)}
            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
              activeClassTab === cls.id ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
            style={{
              backgroundColor: activeClassTab === cls.id ? `${cls.color}30` : '#1a1a1a',
              border: activeClassTab === cls.id ? `1px solid ${cls.color}` : '1px solid transparent',
            }}
          >
            {cls.icon} {cls.name}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="border-b border-[#2a2a2a]">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">이름</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">클래스</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">속성 요약</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">생성일</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {entities.map(entity => {
              const cls = getClassInfo(entity.classId);
              const propSummary = Object.entries(entity.properties).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ');
              return (
                <tr key={entity.id} className="border-b border-[#222] hover:bg-[#222] cursor-pointer" onClick={() => openEditModal(entity)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{cls?.icon || '📦'}</span>
                      <span className="text-white font-medium">{entity.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={cls?.color}>{cls?.name || entity.classId}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono truncate max-w-[300px] hidden md:table-cell">{propSummary}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{entity.createdAt?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(entity.id); }}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              );
            })}
            {entities.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">엔티티가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEntity ? '엔티티 수정' : '새 엔티티 추가'} size="lg">
        <div className="space-y-4">
          <Select
            label="클래스"
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
            options={classes.map(c => ({ value: c.id, label: `${c.icon || ''} ${c.name}` }))}
          />
          <Input label="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-400">속성 (JSON)</label>
            <textarea
              value={form.properties}
              onChange={(e) => setForm({ ...form, properties: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white font-mono text-sm focus:outline-none focus:border-[#E85D3A]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>취소</Button>
            <Button onClick={handleSave}>{editingEntity ? '저장' : '추가'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
