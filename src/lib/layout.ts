import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';
export type LayoutType = 'dagre' | 'radial' | 'grid';

interface LayoutOptions {
  type: LayoutType;
  direction?: LayoutDirection; // for dagre
  nodeWidth?: number;
  nodeHeight?: number;
  spacing?: number;
}

export function applyLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = { type: 'dagre', direction: 'TB' }
): Node[] {
  if (nodes.length === 0) return nodes;

  let layoutNodes: Node[];
  switch (options.type) {
    case 'dagre':
      layoutNodes = applyDagreLayout(nodes, edges, options);
      break;
    case 'radial':
      layoutNodes = applyRadialLayout(nodes, edges, options);
      break;
    case 'grid':
      layoutNodes = applyGridLayout(nodes, options);
      break;
    default:
      layoutNodes = nodes;
  }

  // Preserve saved positions: if a node has hasSavedPosition, keep its original position
  const originalMap = new Map(nodes.map(n => [n.id, n]));
  return layoutNodes.map(node => {
    const original = originalMap.get(node.id);
    if (original && (original.data as any)?.hasSavedPosition) {
      return { ...node, position: original.position };
    }
    return node;
  });
}

function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions
): Node[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  const nodeWidth = options.nodeWidth || 180;
  const nodeHeight = options.nodeHeight || 80;
  const spacing = options.spacing || 60;

  g.setGraph({
    rankdir: options.direction || 'TB',
    nodesep: spacing,
    ranksep: spacing * 1.5,
    edgesep: spacing * 0.5,
    marginx: 50,
    marginy: 50,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  Dagre.layout(g);

  return nodes.map(node => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      },
    };
  });
}

function applyRadialLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions
): Node[] {
  // Find root nodes (nodes with no incoming edges, or the most connected node)
  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();
  for (const node of nodes) {
    incomingCount.set(node.id, 0);
    outgoingCount.set(node.id, 0);
  }
  for (const edge of edges) {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    outgoingCount.set(edge.source, (outgoingCount.get(edge.source) || 0) + 1);
  }

  // Pick center node: most total connections
  let centerId = nodes[0]?.id;
  let maxConnections = 0;
  for (const node of nodes) {
    const total = (incomingCount.get(node.id) || 0) + (outgoingCount.get(node.id) || 0);
    if (total > maxConnections) {
      maxConnections = total;
      centerId = node.id;
    }
  }

  // BFS from center to assign layers
  const layers = new Map<string, number>();
  const queue: string[] = [centerId];
  layers.set(centerId, 0);

  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) adjacency.set(node.id, new Set());
  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLayer = layers.get(current)!;
    for (const neighbor of adjacency.get(current) || []) {
      if (!layers.has(neighbor)) {
        layers.set(neighbor, currentLayer + 1);
        queue.push(neighbor);
      }
    }
  }

  // Assign positions in concentric rings
  const maxLayer = Math.max(...layers.values(), 0);
  const layerNodes = new Map<number, string[]>();
  for (const [id, layer] of layers) {
    if (!layerNodes.has(layer)) layerNodes.set(layer, []);
    layerNodes.get(layer)!.push(id);
  }

  // Place disconnected nodes in the outermost ring
  for (const node of nodes) {
    if (!layers.has(node.id)) {
      const outerLayer = maxLayer + 1;
      layers.set(node.id, outerLayer);
      if (!layerNodes.has(outerLayer)) layerNodes.set(outerLayer, []);
      layerNodes.get(outerLayer)!.push(node.id);
    }
  }

  const nodeWidth = options.nodeWidth || 180;
  const minNodeSpacing = nodeWidth * 1.8; // minimum arc distance between nodes
  const baseRadius = 350;
  const centerX = 600;
  const centerY = 600;

  return nodes.map(node => {
    const layer = layers.get(node.id) || 0;
    if (layer === 0) {
      return { ...node, position: { x: centerX, y: centerY } };
    }

    const nodesInLayer = layerNodes.get(layer) || [];
    const indexInLayer = nodesInLayer.indexOf(node.id);
    // Ensure radius is large enough so nodes don't overlap on the arc
    const minRadius = (nodesInLayer.length * minNodeSpacing) / (2 * Math.PI);
    const radius = Math.max(layer * baseRadius, minRadius);
    const angleStep = (2 * Math.PI) / nodesInLayer.length;
    const angle = indexInLayer * angleStep - Math.PI / 2; // start from top

    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });
}

function applyGridLayout(nodes: Node[], options: LayoutOptions): Node[] {
  const spacing = options.spacing || 60;
  const nodeWidth = options.nodeWidth || 180;
  const nodeHeight = options.nodeHeight || 80;
  const cols = Math.ceil(Math.sqrt(nodes.length));

  return nodes.map((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      ...node,
      position: {
        x: 50 + col * (nodeWidth + spacing),
        y: 50 + row * (nodeHeight + spacing),
      },
    };
  });
}
