'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  type Connection,
  type Node,
  type Edge,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import EntityNode from './EntityNode';
import GroupNode from './GroupNode';
import RelationEdge from './RelationEdge';
import FilterBar from './FilterBar';
import DetailPanel from './DetailPanel';
import LayoutToolbar from './LayoutToolbar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { applyLayout, type LayoutType, type LayoutDirection } from '@/lib/layout';
import type { OntologyClass, PredicateType, GraphNode, GraphEdge } from '@/types';

const nodeTypes = { entityNode: EntityNode, groupNode: GroupNode };
const edgeTypes = { relationEdge: RelationEdge };

function GraphCanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState<Edge>([]);
  // Graph version counter — incremented on any data change to trigger DetailPanel refresh
  const [graphVersion, setGraphVersion] = useState(0);
  const [classes, setClasses] = useState<OntologyClass[]>([]);
  const [predicates, setPredicates] = useState<PredicateType[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const { toast } = useToast();
  const { fitView, setCenter, getNode } = useReactFlow();
  const [classFilter, setClassFilter] = useState<string[]>([]);
  const [predicateFilter, setPredicateFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupingEnabled, setGroupingEnabled] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('graph-grouping') === 'true';
    return false;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [newEntity, setNewEntity] = useState({ name: '', classId: '', description: '' });
  const [newRelation, setNewRelation] = useState({ predicateId: '' });

  // Layout state — restore from localStorage
  const [layoutType, setLayoutType] = useState<LayoutType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('graph-layout-type') as LayoutType) || 'dagre';
    }
    return 'dagre';
  });
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('graph-layout-direction') as LayoutDirection) || 'TB';
    }
    return 'TB';
  });

  // Raw data (before layout)
  const [rawNodes, setRawNodes] = useState<Node[]>([]);
  const [rawEdges, setRawEdges] = useState<Edge[]>([]);

  // Layout key: unique per layout type + direction combo
  const getLayoutKey = useCallback((type?: LayoutType, dir?: LayoutDirection) => {
    const t = type ?? layoutType;
    const d = dir ?? layoutDirection;
    return t === 'dagre' ? `dagre_${d}` : t;
  }, [layoutType, layoutDirection]);

  // Build group nodes from entity nodes by class
  const buildGroupNodes = useCallback((entityNodes: Node[]): Node[] => {
    if (!groupingEnabled || entityNodes.length === 0) return [];

    const padding = 40;
    const headerHeight = 20;
    const classGroups = new Map<string, { nodes: Node[]; classInfo: any }>();

    for (const node of entityNodes) {
      const classId = (node.data as any)?.entity?.classId;
      const classInfo = (node.data as any)?.ontologyClass;
      if (!classId || !classInfo) continue;
      if (!classGroups.has(classId)) classGroups.set(classId, { nodes: [], classInfo });
      classGroups.get(classId)!.nodes.push(node);
    }

    const groups: Node[] = [];
    for (const [classId, { nodes: groupNodes, classInfo }] of classGroups) {
      if (groupNodes.length < 2) continue; // don't group singletons

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of groupNodes) {
        minX = Math.min(minX, n.position.x);
        minY = Math.min(minY, n.position.y);
        maxX = Math.max(maxX, n.position.x + 180);
        maxY = Math.max(maxY, n.position.y + 80);
      }

      groups.push({
        id: `group-${classId}`,
        type: 'groupNode',
        position: { x: minX - padding, y: minY - padding - headerHeight },
        selectable: false,
        draggable: false,
        data: {
          label: classInfo.name,
          icon: classInfo.icon || '📦',
          color: classInfo.color || '#6B7280',
          count: groupNodes.length,
          width: maxX - minX + padding * 2,
          height: maxY - minY + padding * 2 + headerHeight,
        },
        style: { zIndex: -1 },
      });
    }
    return groups;
  }, [groupingEnabled]);

  // Apply layout to raw data
  const applyCurrentLayout = useCallback((nodesData: Node[], edgesData: Edge[], type?: LayoutType, dir?: LayoutDirection) => {
    const lt = type ?? layoutType;
    const ld = dir ?? layoutDirection;
    const layoutNodes = applyLayout(nodesData, edgesData, {
      type: lt,
      direction: ld,
      nodeWidth: 180,
      nodeHeight: 80,
      spacing: 70,
    });
    const groupNodes = buildGroupNodes(layoutNodes);
    setNodes([...groupNodes, ...layoutNodes]);
    setEdges(edgesData);
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
  }, [layoutType, layoutDirection, setNodes, setEdges, fitView, buildGroupNodes]);

  // Fetch graph data with current layoutKey
  const fetchGraph = useCallback(async (type?: LayoutType, dir?: LayoutDirection) => {
    const params = new URLSearchParams();
    if (classFilter.length > 0) params.set('classes', classFilter.join(','));
    if (predicateFilter.length > 0) params.set('predicates', predicateFilter.join(','));
    params.set('layoutKey', getLayoutKey(type, dir));

    const res = await fetch(`/api/graph?${params}`);
    const data = await res.json();

    const newNodes = data.nodes.map((n: GraphNode) => ({
      ...n,
      position: (n.data as any)?.hasSavedPosition ? n.position : { x: 0, y: 0 },
      data: n.data,
    }));
    const newEdges = data.edges.map((e: GraphEdge) => ({
      ...e,
      markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#4a4a4a' },
    }));

    setRawNodes(newNodes);
    setRawEdges(newEdges);
    applyCurrentLayout(newNodes, newEdges, type, dir);
  }, [classFilter, predicateFilter, getLayoutKey, applyCurrentLayout]);

  // Handle layout change — re-fetch with new layoutKey to get correct saved positions
  const handleLayoutChange = useCallback((type: LayoutType, direction?: LayoutDirection) => {
    const dir = direction ?? (type === 'dagre' ? layoutDirection : undefined);
    setLayoutType(type);
    if (direction) setLayoutDirection(direction);
    localStorage.setItem('graph-layout-type', type);
    if (direction) localStorage.setItem('graph-layout-direction', direction);
    // Re-fetch to get saved positions for the new layout
    fetchGraph(type, dir);
    toast(`레이아웃 변경: ${
      type === 'dagre' ? '계층형' : type === 'radial' ? '방사형' : '그리드'
    }${type === 'dagre' ? ` (${(dir) === 'TB' ? '↓' : (dir) === 'LR' ? '→' : (dir) === 'BT' ? '↑' : '←'})` : ''}`, 'info');
  }, [layoutDirection, fetchGraph, toast]);

  // Reset layout: clear saved positions for current layout and re-apply algorithm
  const handleResetLayout = useCallback(async () => {
    const layoutKey = getLayoutKey();
    // Clear all saved positions for this layout key
    await Promise.all(
      rawNodes
        .filter(n => (n.data as any)?.hasSavedPosition)
        .map(n =>
          fetch(`/api/entities/${n.id}/position`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x: null, y: null, layoutKey }),
          })
        )
    );
    // Re-apply layout from scratch (no saved positions)
    const resetNodes = rawNodes.map(n => ({
      ...n,
      data: { ...n.data, hasSavedPosition: false },
    }));
    setRawNodes(resetNodes);
    applyCurrentLayout(resetNodes, rawEdges);
    toast('레이아웃 재정렬 완료', 'info');
  }, [getLayoutKey, rawNodes, rawEdges, applyCurrentLayout, toast]);

  // Fetch classes and predicates
  useEffect(() => {
    Promise.all([
      fetch('/api/classes').then(r => r.json()),
      fetch('/api/predicates').then(r => r.json()),
    ]).then(([classData, predData]) => {
      setClasses(classData.items);
      setPredicates(predData.items);
    });
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Compute connected node IDs for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedEntityId) return new Set<string>();
    const ids = new Set<string>();
    for (const edge of rawEdges) {
      if (edge.source === selectedEntityId) ids.add(edge.target);
      if (edge.target === selectedEntityId) ids.add(edge.source);
    }
    return ids;
  }, [selectedEntityId, rawEdges]);

  // Update node data with isConnected/isDimmed flags (skip group nodes)
  useEffect(() => {
    const hasSelection = !!selectedEntityId;
    setNodes(prev => prev.map(node => {
      if (node.type === 'groupNode') return node; // skip group nodes
      return {
        ...node,
        data: {
          ...node.data,
          isConnected: connectedNodeIds.has(node.id),
          isDimmed: hasSelection && node.id !== selectedEntityId && !connectedNodeIds.has(node.id),
        },
      };
    }));
    // Also highlight connected edges
    setEdges(prev => prev.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        isHighlighted: hasSelection && (edge.source === selectedEntityId || edge.target === selectedEntityId),
        isDimmed: hasSelection && edge.source !== selectedEntityId && edge.target !== selectedEntityId,
      },
    })));
  }, [connectedNodeIds, selectedEntityId, setNodes, setEdges]);

  // Pan graph to node and select it in React Flow
  const panToNode = useCallback((nodeId: string) => {
    // Update React Flow's internal selection state
    setNodes(prev => prev.map(n => ({
      ...n,
      selected: n.id === nodeId,
    })));
    const node = getNode(nodeId);
    if (node) {
      const x = node.position.x + (node.measured?.width ?? 180) / 2;
      const y = node.position.y + (node.measured?.height ?? 80) / 2;
      setCenter(x, y, { duration: 400, zoom: 1 });
    }
  }, [getNode, setCenter, setNodes]);

  // Search: highlight/focus matching node
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const matchNode = nodes.find(n =>
      (n.data as any)?.entity?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (matchNode) {
      setSelectedEntityId(matchNode.id);
    }
  }, [searchQuery, nodes]);

  // Handle edge changes — persist deletions to DB
  const onEdgesChange = useCallback((changes: any[]) => {
    onEdgesChangeBase(changes);
    const removals = changes.filter((c: any) => c.type === 'remove');
    if (removals.length > 0) {
      Promise.all(
        removals.map((c: any) =>
          fetch(`/api/relations/${c.id}`, { method: 'DELETE' })
        )
      ).then(() => {
        // Update rawEdges to stay in sync
        const removedIds = new Set(removals.map((c: any) => c.id));
        setRawEdges(prev => prev.filter(e => !removedIds.has(e.id)));
        setGraphVersion(v => v + 1);
        toast('관계 삭제 완료', 'info');
      });
    }
  }, [onEdgesChangeBase, toast]);

  // Handle connection (drag edge between nodes)
  const onConnect = useCallback((connection: Connection) => {
    setPendingConnection(connection);
    setShowRelationModal(true);
  }, []);

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.type === 'groupNode') return; // ignore group node clicks
    setSelectedEntityId(node.id);
    panToNode(node.id);
  }, [panToNode]);

  const onPaneClick = useCallback(() => {
    setSelectedEntityId(null);
  }, []);

  // Save node position on drag end
  const onNodeDragStop = useCallback((_: any, node: Node) => {
    if (node.type === 'groupNode') return; // skip group nodes
    const layoutKey = getLayoutKey();
    fetch(`/api/entities/${node.id}/position`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: node.position.x, y: node.position.y, layoutKey }),
    });
    setRawNodes(prev => prev.map(n =>
      n.id === node.id
        ? { ...n, position: node.position, data: { ...n.data, hasSavedPosition: true } }
        : n
    ));
  }, [getLayoutKey]);

  // Add entity
  const handleAddEntity = async () => {
    if (!newEntity.name || !newEntity.classId) return;
    await fetch('/api/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newEntity.name,
        classId: newEntity.classId,
        description: newEntity.description,
        properties: {},
      }),
    });
    setShowAddModal(false);
    setNewEntity({ name: '', classId: '', description: '' });
    toast(`"${newEntity.name}" 추가 완료`, 'success');
    setGraphVersion(v => v + 1);
    fetchGraph();
  };

  // Add relation
  const handleAddRelation = async () => {
    if (!pendingConnection || !newRelation.predicateId) return;
    const res = await fetch('/api/relations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: pendingConnection.source,
        targetId: pendingConnection.target,
        predicateId: newRelation.predicateId,
      }),
    });
    setShowRelationModal(false);
    setPendingConnection(null);
    setNewRelation({ predicateId: '' });
    if (res.status === 409) {
      toast('이미 동일한 관계가 존재합니다', 'warning');
      return;
    }
    toast('관계 추가 완료', 'success');
    setGraphVersion(v => v + 1);
    fetchGraph();
  };

  // Triple table data
  const tripleData = useMemo(() => {
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      return {
        id: edge.id,
        subject: (sourceNode?.data as any)?.entity?.name || edge.source,
        predicate: (edge.data as any)?.predicate?.name || (edge as any).label || '?',
        object: (targetNode?.data as any)?.entity?.name || edge.target,
      };
    });
  }, [nodes, edges]);

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        classes={classes}
        predicates={predicates}
        classFilter={classFilter}
        predicateFilter={predicateFilter}
        onClassFilterChange={setClassFilter}
        onPredicateFilterChange={setPredicateFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex flex-1 min-h-0">
        {/* Graph */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            defaultEdgeOptions={{
              type: 'relationEdge',
              markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#4a4a4a' },
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a1a1a" />
            <Controls />
            <Panel position="bottom-left" className="!ml-0 !mb-0" style={{ left: 10, bottom: 175 }}>
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleResetLayout}
                  className="w-[26px] h-[26px] flex items-center justify-center bg-white/[0.05] hover:bg-white/10 border border-[#3a3a3a] rounded text-gray-400 hover:text-white transition-colors"
                  title="레이아웃 재정렬"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v-3h3" />
                    <path d="M3.51 11a7 7 0 0 1-1.36-3.36A7 7 0 0 1 8 1a7 7 0 0 1 6.36 4" />
                    <path d="M15 12v3h-3" />
                    <path d="M12.49 5a7 7 0 0 1 1.36 3.36A7 7 0 0 1 8 15a7 7 0 0 1-6.36-4" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const next = !groupingEnabled;
                    setGroupingEnabled(next);
                    localStorage.setItem('graph-grouping', String(next));
                    // Re-apply layout to add/remove group nodes
                    if (next) {
                      const groupNodes = buildGroupNodes(rawNodes.map((n, i) => {
                        // use current displayed positions
                        const displayed = nodes.find(dn => dn.id === n.id);
                        return displayed ? { ...n, position: displayed.position } : n;
                      }));
                      setNodes(prev => [...groupNodes, ...prev.filter(n => !n.id.startsWith('group-'))]);
                    } else {
                      setNodes(prev => prev.filter(n => !n.id.startsWith('group-')));
                    }
                    toast(next ? '클래스 그룹핑 활성화' : '클래스 그룹핑 비활성화', 'info');
                  }}
                  className={`w-[26px] h-[26px] flex items-center justify-center border rounded transition-colors ${
                    groupingEnabled
                      ? 'bg-[#E85D3A]/20 border-[#E85D3A]/50 text-[#E85D3A]'
                      : 'bg-white/[0.05] hover:bg-white/10 border-[#3a3a3a] text-gray-400 hover:text-white'
                  }`}
                  title="클래스별 그룹핑"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="1" width="6" height="6" rx="1" />
                    <rect x="9" y="1" width="6" height="6" rx="1" />
                    <rect x="1" y="9" width="6" height="6" rx="1" />
                    <rect x="9" y="9" width="6" height="6" rx="1" />
                  </svg>
                </button>
              </div>
            </Panel>
            <MiniMap
              nodeColor={(node) => (node.data as any)?.ontologyClass?.color || '#6B7280'}
              maskColor="rgba(0,0,0,0.7)"
            />
          </ReactFlow>

          {/* Layout Toolbar */}
          <LayoutToolbar
            layoutType={layoutType}
            layoutDirection={layoutDirection}
            onLayoutChange={handleLayoutChange}
          />

          {/* Floating Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="absolute bottom-6 right-6 w-12 h-12 bg-[#E85D3A] hover:bg-[#d14e2e] rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition-colors z-10"
          >
            +
          </button>
        </div>

        {/* Detail Panel */}
        {selectedEntityId && (
          <DetailPanel
            entityId={selectedEntityId}
            classes={classes}
            predicates={predicates}
            onClose={() => setSelectedEntityId(null)}
            onNavigate={(id) => { setSelectedEntityId(id); panToNode(id); }}
            version={graphVersion}
          />
        )}
      </div>

      {/* Triple Table */}
      <div className="h-48 border-t border-[#2a2a2a] bg-[#111] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#111] border-b border-[#2a2a2a]">
            <tr>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">주어</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">술어</th>
              <th className="text-left px-4 py-2 text-gray-500 font-medium">목적어</th>
            </tr>
          </thead>
          <tbody>
            {tripleData.map(triple => (
              <tr key={triple.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                <td className="px-4 py-1.5 text-white">{triple.subject}</td>
                <td className="px-4 py-1.5 text-[#E85D3A]">{triple.predicate}</td>
                <td className="px-4 py-1.5 text-white">{triple.object}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Entity Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="새 엔티티 추가">
        <div className="space-y-4">
          <Select
            label="클래스"
            value={newEntity.classId}
            onChange={(e) => setNewEntity({ ...newEntity, classId: e.target.value })}
            options={[
              { value: '', label: '클래스 선택...' },
              ...classes.map(c => ({ value: c.id, label: `${c.icon || ''} ${c.name}` })),
            ]}
          />
          <Input
            label="이름"
            value={newEntity.name}
            onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
            placeholder="엔티티 이름"
          />
          <Input
            label="설명"
            value={newEntity.description}
            onChange={(e) => setNewEntity({ ...newEntity, description: e.target.value })}
            placeholder="설명 (선택)"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>취소</Button>
            <Button onClick={handleAddEntity}>추가</Button>
          </div>
        </div>
      </Modal>

      {/* Add Relation Modal */}
      <Modal isOpen={showRelationModal} onClose={() => { setShowRelationModal(false); setPendingConnection(null); }} title="관계 추가">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {pendingConnection?.source} → {pendingConnection?.target}
          </p>
          <Select
            label="관계 유형"
            value={newRelation.predicateId}
            onChange={(e) => setNewRelation({ predicateId: e.target.value })}
            options={[
              { value: '', label: '관계 유형 선택...' },
              ...predicates.map(p => ({ value: p.id, label: p.name })),
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowRelationModal(false); setPendingConnection(null); }}>취소</Button>
            <Button onClick={handleAddRelation}>추가</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Wrap with ReactFlowProvider for useReactFlow hook
export default function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner />
    </ReactFlowProvider>
  );
}
