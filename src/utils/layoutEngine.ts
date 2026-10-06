import { FlowEdge, FlowGraphNode, LayoutDirection } from '../types';

export interface LayoutResult {
  positionedNodes: FlowGraphNode[];
  edges: FlowEdge[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 74;
const GAP_X_HORIZONTAL = 80;
const GAP_Y_HORIZONTAL = 28;

const GAP_X_VERTICAL = 36;
const GAP_Y_VERTICAL = 84;

export function computeGraphLayout(
  nodesMap: Map<string, FlowGraphNode>,
  rootId: string,
  direction: LayoutDirection = 'horizontal',
  collapsedSet: Set<string> = new Set()
): LayoutResult {
  const rootNode = nodesMap.get(rootId);
  if (!rootNode) {
    return {
      positionedNodes: [],
      edges: [],
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
    };
  }

  // Clone nodes to avoid mutating state during calculation
  const workingNodes = new Map<string, FlowGraphNode>();
  nodesMap.forEach((n, id) => {
    const isCollapsed = collapsedSet.has(id);
    workingNodes.set(id, {
      ...n,
      collapsed: isCollapsed,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      x: 0,
      y: 0,
      subtreeWidth: 0,
      subtreeHeight: 0,
    });
  });

  const visibleNodes: FlowGraphNode[] = [];
  const edges: FlowEdge[] = [];

  if (direction === 'horizontal') {
    // 1. Post-order traversal to calculate subtree heights
    function calcSubtreeSizeHorizontal(id: string): { width: number; height: number } {
      const node = workingNodes.get(id);
      if (!node) return { width: NODE_WIDTH, height: NODE_HEIGHT };

      const isCollapsed = node.collapsed;
      const validChildIds = !isCollapsed ? node.childIds : [];

      if (validChildIds.length === 0) {
        node.subtreeWidth = NODE_WIDTH;
        node.subtreeHeight = NODE_HEIGHT;
        return { width: node.subtreeWidth, height: node.subtreeHeight };
      }

      let totalChildHeight = 0;
      let maxChildSubtreeWidth = 0;

      validChildIds.forEach((childId, idx) => {
        const childSize = calcSubtreeSizeHorizontal(childId);
        totalChildHeight += childSize.height;
        if (idx < validChildIds.length - 1) {
          totalChildHeight += GAP_Y_HORIZONTAL;
        }
        maxChildSubtreeWidth = Math.max(maxChildSubtreeWidth, childSize.width);
      });

      node.subtreeHeight = Math.max(NODE_HEIGHT, totalChildHeight);
      node.subtreeWidth = NODE_WIDTH + GAP_X_HORIZONTAL + maxChildSubtreeWidth;
      return { width: node.subtreeWidth, height: node.subtreeHeight };
    }

    calcSubtreeSizeHorizontal(rootId);

    // 2. Pre-order traversal to place coordinates
    function positionNodesHorizontal(id: string, startX: number, currentY: number) {
      const node = workingNodes.get(id);
      if (!node) return;

      node.x = startX;
      // Center the node within its subtree height
      node.y = currentY + (node.subtreeHeight - NODE_HEIGHT) / 2;
      visibleNodes.push(node);

      if (!node.collapsed && node.childIds.length > 0) {
        let childY = currentY;
        const nextX = startX + NODE_WIDTH + GAP_X_HORIZONTAL;

        node.childIds.forEach((childId) => {
          const childNode = workingNodes.get(childId);
          if (childNode) {
            positionNodesHorizontal(childId, nextX, childY);
            childY += childNode.subtreeHeight + GAP_Y_HORIZONTAL;

            // Add edge
            edges.push({
              id: `edge_${node.id}_${childNode.id}`,
              sourceId: node.id,
              targetId: childNode.id,
              sourceType: node.type,
              targetType: childNode.type,
              path: childNode.path,
            });
          }
        });
      }
    }

    positionNodesHorizontal(rootId, 40, 40);
  } else {
    // Vertical Layout (Top to bottom)
    function calcSubtreeSizeVertical(id: string): { width: number; height: number } {
      const node = workingNodes.get(id);
      if (!node) return { width: NODE_WIDTH, height: NODE_HEIGHT };

      const isCollapsed = node.collapsed;
      const validChildIds = !isCollapsed ? node.childIds : [];

      if (validChildIds.length === 0) {
        node.subtreeWidth = NODE_WIDTH;
        node.subtreeHeight = NODE_HEIGHT;
        return { width: node.subtreeWidth, height: node.subtreeHeight };
      }

      let totalChildWidth = 0;
      let maxChildSubtreeHeight = 0;

      validChildIds.forEach((childId, idx) => {
        const childSize = calcSubtreeSizeVertical(childId);
        totalChildWidth += childSize.width;
        if (idx < validChildIds.length - 1) {
          totalChildWidth += GAP_X_VERTICAL;
        }
        maxChildSubtreeHeight = Math.max(maxChildSubtreeHeight, childSize.height);
      });

      node.subtreeWidth = Math.max(NODE_WIDTH, totalChildWidth);
      node.subtreeHeight = NODE_HEIGHT + GAP_Y_VERTICAL + maxChildSubtreeHeight;
      return { width: node.subtreeWidth, height: node.subtreeHeight };
    }

    calcSubtreeSizeVertical(rootId);

    function positionNodesVertical(id: string, currentX: number, startY: number) {
      const node = workingNodes.get(id);
      if (!node) return;

      // Center node in subtree width
      node.x = currentX + (node.subtreeWidth - NODE_WIDTH) / 2;
      node.y = startY;
      visibleNodes.push(node);

      if (!node.collapsed && node.childIds.length > 0) {
        let childX = currentX;
        const nextY = startY + NODE_HEIGHT + GAP_Y_VERTICAL;

        node.childIds.forEach((childId) => {
          const childNode = workingNodes.get(childId);
          if (childNode) {
            positionNodesVertical(childId, childX, nextY);
            childX += childNode.subtreeWidth + GAP_X_VERTICAL;

            edges.push({
              id: `edge_${node.id}_${childNode.id}`,
              sourceId: node.id,
              targetId: childNode.id,
              sourceType: node.type,
              targetType: childNode.type,
              path: childNode.path,
            });
          }
        });
      }
    }

    positionNodesVertical(rootId, 40, 40);
  }

  // Calculate overall bounds
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  visibleNodes.forEach((n) => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  });

  if (visibleNodes.length === 0) {
    minX = 0;
    minY = 0;
    maxX = 0;
    maxY = 0;
  }

  return {
    positionedNodes: visibleNodes,
    edges,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(100, maxX - minX),
      height: Math.max(100, maxY - minY),
    },
  };
}

/**
 * Returns smooth SVG path cubic bezier between two nodes
 */
export function getCurvedPath(
  source: FlowGraphNode,
  target: FlowGraphNode,
  direction: LayoutDirection
): string {
  if (direction === 'horizontal') {
    const x1 = source.x + source.width;
    const y1 = source.y + source.height / 2;
    const x2 = target.x;
    const y2 = target.y + target.height / 2;

    const dx = Math.max(30, (x2 - x1) * 0.45);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  } else {
    const x1 = source.x + source.width / 2;
    const y1 = source.y + source.height;
    const x2 = target.x + target.width / 2;
    const y2 = target.y;

    const dy = Math.max(30, (y2 - y1) * 0.45);
    return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
  }
}
