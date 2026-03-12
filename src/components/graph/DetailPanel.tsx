'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { Entity, OntologyClass, Relation, PredicateType } from '@/types';

interface DetailPanelProps {
  entityId: string | null;
  classes: OntologyClass[];
  predicates: PredicateType[];
  onClose: () => void;
  onNavigate: (entityId: string) => void;
  version?: number;
}

interface EntityDetail extends Entity {
  relations: Array<Relation & { predicate?: PredicateType }>;
}

export default function DetailPanel({ entityId, classes, predicates, onClose, onNavigate, version }: DetailPanelProps) {
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [relatedEntities, setRelatedEntities] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!entityId) { setEntity(null); return; }
    fetch(`/api/entities/${entityId}`)
      .then(r => r.json())
      .then(res => {
        setEntity(res.data);
        // Fetch related entity names
        const ids = new Set<string>();
        for (const rel of res.data.relations || []) {
          ids.add(rel.sourceId);
          ids.add(rel.targetId);
        }
        ids.delete(entityId);
        Promise.all(
          Array.from(ids).map(id =>
            fetch(`/api/entities/${id}`).then(r => r.json()).then(r => [id, r.data?.name || id] as [string, string])
          )
        ).then(pairs => setRelatedEntities(new Map(pairs)));
      });
  }, [entityId, version]);

  if (!entityId || !entity) return null;

  const cls = classes.find(c => c.id === entity.classId);

  return (
    <div className="w-[320px] bg-[#111] border-l border-[#2a2a2a] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <h3 className="font-semibold text-sm">엔티티 상세</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Entity Info */}
        <div className="text-center">
          <span className="text-4xl">{cls?.icon || '📦'}</span>
          <h2 className="text-lg font-bold mt-2">{entity.name}</h2>
          <Badge color={cls?.color}>{cls?.name || entity.classId}</Badge>
        </div>

        {entity.description && (
          <p className="text-sm text-gray-400">{entity.description}</p>
        )}

        {/* Properties */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">속성</h4>
          <div className="space-y-1.5">
            {Object.entries(entity.properties).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-400">{key}</span>
                <span className="text-white font-mono text-xs">
                  {Array.isArray(value) ? value.join(', ') : String(value ?? '-')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Relations */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            관계 ({entity.relations?.length || 0})
          </h4>
          <div className="space-y-2">
            {entity.relations?.map(rel => {
              const isSource = rel.sourceId === entity.id;
              const otherId = isSource ? rel.targetId : rel.sourceId;
              const otherName = relatedEntities.get(otherId) || otherId;
              const predName = rel.predicate?.name || rel.predicateId;

              return (
                <div
                  key={rel.id}
                  className="p-2 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] cursor-pointer hover:border-[#3a3a3a] transition-colors"
                  onClick={() => onNavigate(otherId)}
                >
                  <div className="text-xs text-gray-500">
                    {isSource ? '→' : '←'} {predName}
                  </div>
                  <div className="text-sm text-white font-medium">{otherName}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
