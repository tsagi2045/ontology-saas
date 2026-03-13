'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import PageLoader from '@/components/ui/PageLoader';
import type { InferenceRule, RuleCondition, RuleAction, OntologyClass, PredicateType } from '@/types';

export default function RulesPage() {
  const [rules, setRules] = useState<InferenceRule[]>([]);
  const [classes, setClasses] = useState<OntologyClass[]>([]);
  const [predicates, setPredicates] = useState<PredicateType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<InferenceRule | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [executeResults, setExecuteResults] = useState<any>(null);

  // Rule form
  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 0,
    isActive: true,
    conditions: [] as RuleCondition[],
    actions: [] as RuleAction[],
  });

  const fetchData = () => {
    Promise.all([
      fetch('/api/rules').then(r => r.json()),
      fetch('/api/classes').then(r => r.json()),
      fetch('/api/predicates').then(r => r.json()),
    ]).then(([rulesData, classData, predData]) => {
      setRules(rulesData.items);
      setClasses(classData.items);
      setPredicates(predData.items);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (rule: InferenceRule) => {
    await fetch(`/api/rules/${rule.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rule, isActive: !rule.isActive }),
    });
    toast(`"${rule.name}" ${rule.isActive ? '비활성화' : '활성화'} 완료`, 'success');
    fetchData();
  };

  const handleTest = async (ruleId: string) => {
    const res = await fetch(`/api/rules/${ruleId}/test`, { method: 'POST' });
    const data = await res.json();
    setTestResults(data.data);
    toast(`테스트 완료: ${data.data.affectedEntities.length}개 엔티티 영향`, 'info');
  };

  const handleExecuteAll = async () => {
    const confirmed = await confirm({
      title: '전체 규칙 실행',
      message: '모든 활성 추론 규칙을 실행합니다. 데이터가 변경될 수 있습니다.',
      confirmLabel: '실행',
      variant: 'primary',
    });
    if (!confirmed) return;

    const res = await fetch('/api/rules/execute', { method: 'POST' });
    const data = await res.json();
    setExecuteResults(data.data);
    const totalAffected = data.data.reduce((sum: number, r: any) => sum + r.affectedEntities.length, 0);
    toast(`규칙 실행 완료: ${totalAffected}개 엔티티 영향`, 'success');
  };

  const openBuilder = (rule?: InferenceRule) => {
    if (rule) {
      setEditingRule(rule);
      setForm({
        name: rule.name,
        description: rule.description || '',
        priority: rule.priority,
        isActive: rule.isActive,
        conditions: rule.conditions,
        actions: rule.actions,
      });
    } else {
      setEditingRule(null);
      setForm({ name: '', description: '', priority: 0, isActive: true, conditions: [], actions: [] });
    }
    setShowBuilder(true);
  };

  const addCondition = () => {
    setForm({ ...form, conditions: [...form.conditions, { type: 'class_check', entityClassId: '' }] });
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const conditions = [...form.conditions];
    conditions[index] = { ...conditions[index], ...updates };
    setForm({ ...form, conditions });
  };

  const removeCondition = (index: number) => {
    setForm({ ...form, conditions: form.conditions.filter((_, i) => i !== index) });
  };

  const addAction = () => {
    setForm({ ...form, actions: [...form.actions, { type: 'add_tag', tag: '' }] });
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    const actions = [...form.actions];
    actions[index] = { ...actions[index], ...updates };
    setForm({ ...form, actions });
  };

  const removeAction = (index: number) => {
    setForm({ ...form, actions: form.actions.filter((_, i) => i !== index) });
  };

  const handleSaveRule = async () => {
    const body = {
      name: form.name,
      description: form.description,
      priority: form.priority,
      isActive: form.isActive,
      conditions: form.conditions,
      actions: form.actions,
    };

    if (editingRule) {
      await fetch(`/api/rules/${editingRule.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setShowBuilder(false);
    toast(`"${form.name}" ${editingRule ? '수정' : '생성'} 완료`, 'success');
    fetchData();
  };

  const handleDeleteRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    const confirmed = await confirm({
      title: '규칙 삭제',
      message: `"${rule?.name}" 규칙을 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      variant: 'danger',
    });
    if (!confirmed) return;
    await fetch(`/api/rules/${id}`, { method: 'DELETE' });
    toast(`"${rule?.name}" 삭제 완료`, 'success');
    fetchData();
  };

  const conditionSummary = (c: RuleCondition) => {
    switch (c.type) {
      case 'class_check': return `클래스 = ${classes.find(cl => cl.id === c.entityClassId)?.name || c.entityClassId}`;
      case 'property_check': return `${c.propertyName} ${c.operator} ${c.value}`;
      case 'relation_exists': return `관계 "${predicates.find(p => p.id === c.predicateId)?.name || c.predicateId}" 존재`;
      case 'relation_count': return `관계 "${predicates.find(p => p.id === c.predicateId)?.name || c.predicateId}" >= ${c.minCount}회`;
      default: return JSON.stringify(c);
    }
  };

  const actionSummary = (a: RuleAction) => {
    switch (a.type) {
      case 'set_property': return `속성 "${a.propertyName}" = ${a.value}`;
      case 'add_tag': return `태그 "${a.tag}" 추가`;
      case 'change_class': return `클래스 → ${classes.find(c => c.id === a.value)?.name || a.value}`;
      case 'add_relation': return `관계 추가 (${a.predicateId})`;
      default: return JSON.stringify(a);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">추론 규칙 엔진</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExecuteAll}>전체 규칙 실행</Button>
          <Button onClick={() => openBuilder()}>+ 새 규칙</Button>
        </div>
      </div>

      {/* Execute Results */}
      {executeResults && (
        <Card className="p-4 border-green-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-green-400">실행 결과</h3>
            <button onClick={() => setExecuteResults(null)} className="text-gray-400 hover:text-white">&times;</button>
          </div>
          {executeResults.length === 0 ? (
            <p className="text-gray-500 text-sm">영향받은 엔티티가 없습니다.</p>
          ) : (
            executeResults.map((r: any) => (
              <div key={r.ruleId} className="mb-2">
                <p className="text-sm font-medium text-white">{r.ruleName}</p>
                {r.affectedEntities.map((e: any) => (
                  <p key={e.entityId} className="text-xs text-gray-400 ml-4">• {e.entityName}: {e.actions.join(', ')}</p>
                ))}
              </div>
            ))
          )}
        </Card>
      )}

      {/* Rules List */}
      <div className="grid grid-cols-1 gap-4">
        {rules.map(rule => (
          <Card key={rule.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{rule.name}</h3>
                  <Badge color={rule.isActive ? '#22C55E' : '#6B7280'}>{rule.isActive ? '활성' : '비활성'}</Badge>
                  <Badge color="#F59E0B">우선순위: {rule.priority}</Badge>
                </div>
                {rule.description && <p className="text-sm text-gray-400 mb-3">{rule.description}</p>}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">IF (조건)</p>
                    {rule.conditions.map((c, i) => (
                      <p key={i} className="text-sm text-blue-400">• {conditionSummary(c)}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">THEN (액션)</p>
                    {rule.actions.map((a, i) => (
                      <p key={i} className="text-sm text-green-400">• {actionSummary(a)}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button size="sm" variant="ghost" onClick={() => handleToggle(rule)}>
                  {rule.isActive ? '비활성화' : '활성화'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleTest(rule.id)}>테스트</Button>
                <Button size="sm" variant="secondary" onClick={() => openBuilder(rule)}>편집</Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteRule(rule.id)}>삭제</Button>
              </div>
            </div>

            {/* Test Results inline */}
            {testResults?.ruleId === rule.id && (
              <div className="mt-3 p-3 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
                <p className="text-xs font-semibold text-gray-500 mb-1">테스트 결과 (영향받는 엔티티: {testResults.affectedEntities.length})</p>
                {testResults.affectedEntities.length === 0 ? (
                  <p className="text-sm text-gray-500">조건에 맞는 엔티티가 없습니다.</p>
                ) : (
                  testResults.affectedEntities.map((e: any) => (
                    <p key={e.entityId} className="text-sm text-yellow-400">• {e.entityName}: {e.actions.join(', ')}</p>
                  ))
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Rule Builder Modal */}
      <Modal isOpen={showBuilder} onClose={() => setShowBuilder(false)} title={editingRule ? '규칙 수정' : '새 규칙 추가'} size="lg">
        <div className="space-y-4">
          <Input label="규칙 이름" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="설명" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="우선순위" type="number" value={String(form.priority)} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
            <Select label="상태" value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })} options={[{ value: 'true', label: '활성' }, { value: 'false', label: '비활성' }]} />
          </div>

          {/* Conditions */}
          <div className="border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-400">IF 조건</h4>
              <button onClick={addCondition} className="text-xs text-[#E85D3A] hover:underline">+ 조건 추가</button>
            </div>
            {form.conditions.map((cond, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-[#0f0f0f] rounded">
                <Select value={cond.type} onChange={e => updateCondition(i, { type: e.target.value as any })} options={[
                  { value: 'class_check', label: '클래스 체크' },
                  { value: 'property_check', label: '속성 값 체크' },
                  { value: 'relation_exists', label: '관계 존재 여부' },
                  { value: 'relation_count', label: '관계 횟수' },
                ]} />
                {cond.type === 'class_check' && (
                  <Select value={cond.entityClassId || ''} onChange={e => updateCondition(i, { entityClassId: e.target.value })} options={[{ value: '', label: '선택...' }, ...classes.map(c => ({ value: c.id, label: c.name }))]} />
                )}
                {cond.type === 'property_check' && (
                  <>
                    <input className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white w-24" placeholder="속성명" value={cond.propertyName || ''} onChange={e => updateCondition(i, { propertyName: e.target.value })} />
                    <Select value={cond.operator || 'eq'} onChange={e => updateCondition(i, { operator: e.target.value as any })} options={[
                      { value: 'eq', label: '=' }, { value: 'neq', label: '≠' }, { value: 'gt', label: '>' },
                      { value: 'gte', label: '≥' }, { value: 'lt', label: '<' }, { value: 'lte', label: '≤' },
                      { value: 'contains', label: '포함' },
                    ]} />
                    <input className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white w-24" placeholder="값" value={cond.value ?? ''} onChange={e => updateCondition(i, { value: e.target.value })} />
                  </>
                )}
                {(cond.type === 'relation_exists' || cond.type === 'relation_count') && (
                  <>
                    <Select value={cond.predicateId || ''} onChange={e => updateCondition(i, { predicateId: e.target.value })} options={[{ value: '', label: '선택...' }, ...predicates.map(p => ({ value: p.id, label: p.name }))]} />
                    {cond.type === 'relation_count' && (
                      <input className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white w-16" type="number" placeholder="최소" value={cond.minCount ?? ''} onChange={e => updateCondition(i, { minCount: parseInt(e.target.value) || 0 })} />
                    )}
                  </>
                )}
                <button onClick={() => removeCondition(i)} className="text-red-400 hover:text-red-300 text-xs ml-auto">삭제</button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-green-400">THEN 액션</h4>
              <button onClick={addAction} className="text-xs text-[#E85D3A] hover:underline">+ 액션 추가</button>
            </div>
            {form.actions.map((act, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-[#0f0f0f] rounded">
                <Select value={act.type} onChange={e => updateAction(i, { type: e.target.value as any })} options={[
                  { value: 'set_property', label: '속성 값 설정' },
                  { value: 'add_tag', label: '태그 부여' },
                  { value: 'change_class', label: '클래스 변경' },
                  { value: 'add_relation', label: '관계 추가' },
                ]} />
                {act.type === 'set_property' && (
                  <>
                    <input className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white w-24" placeholder="속성명" value={act.propertyName || ''} onChange={e => updateAction(i, { propertyName: e.target.value })} />
                    <input className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white w-24" placeholder="값" value={act.value ?? ''} onChange={e => updateAction(i, { value: e.target.value })} />
                  </>
                )}
                {act.type === 'add_tag' && (
                  <input className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white w-32" placeholder="태그명" value={act.tag || ''} onChange={e => updateAction(i, { tag: e.target.value })} />
                )}
                {act.type === 'change_class' && (
                  <Select value={act.value || ''} onChange={e => updateAction(i, { value: e.target.value })} options={[{ value: '', label: '선택...' }, ...classes.map(c => ({ value: c.id, label: c.name }))]} />
                )}
                {act.type === 'add_relation' && (
                  <Select value={act.predicateId || ''} onChange={e => updateAction(i, { predicateId: e.target.value })} options={[{ value: '', label: '선택...' }, ...predicates.map(p => ({ value: p.id, label: p.name }))]} />
                )}
                <button onClick={() => removeAction(i)} className="text-red-400 hover:text-red-300 text-xs ml-auto">삭제</button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBuilder(false)}>취소</Button>
            <Button onClick={handleSaveRule}>저장</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
