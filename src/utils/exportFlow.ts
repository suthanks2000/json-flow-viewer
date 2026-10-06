import { FlowGraphNode, FlowEdge, LayoutDirection } from '../types';
import { getCurvedPath } from './layoutEngine';

export interface CanvasCaptureOptions {
  nodes: FlowGraphNode[];
  edges: FlowEdge[];
  direction: LayoutDirection;
  isDarkMode: boolean;
  mode?: 'viewport' | 'full';
  pan?: { x: number; y: number };
  scale?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  selectedNodeId?: string | null;
  searchMatchNodeIds?: Set<string>;
  resolutionScale?: number;
  includeGrid?: boolean;
  filename?: string;
}

/**
 * Captures the FlowViewer canvas state and triggers a high-quality PNG download using the HTML5 Canvas API.
 */
export async function captureFlowCanvasAsPng(options: CanvasCaptureOptions): Promise<string> {
  const {
    nodes,
    edges,
    direction,
    isDarkMode,
    mode = 'full',
    pan = { x: 0, y: 0 },
    scale = 1,
    viewportWidth = 1200,
    viewportHeight = 800,
    selectedNodeId = null,
    searchMatchNodeIds = new Set(),
    resolutionScale = 2,
    includeGrid = true,
    filename,
  } = options;

  if (nodes.length === 0) {
    throw new Error('No nodes available to capture');
  }

  // Determine canvas dimensions based on capture mode
  let canvasWidth: number;
  let canvasHeight: number;
  let originX = 0;
  let originY = 0;
  let effectiveScale = scale;

  if (mode === 'viewport') {
    // Exact viewport capture (what user is seeing on screen)
    canvasWidth = Math.max(300, viewportWidth);
    canvasHeight = Math.max(200, viewportHeight);
    originX = pan.x;
    originY = pan.y;
    effectiveScale = scale;
  } else {
    // Full diagram capture (all visible nodes fitted with comfortable margins)
    const padding = 60;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });

    canvasWidth = Math.max(400, maxX - minX + padding * 2);
    canvasHeight = Math.max(300, maxY - minY + padding * 2);
    originX = -minX + padding;
    originY = -minY + padding;
    effectiveScale = 1;
  }

  // Create HTML5 Canvas element
  const canvas = document.createElement('canvas');
  const dpr = Math.max(1, Math.min(resolutionScale, 4)); // 2x default for crisp retina rendering
  canvas.width = Math.round(canvasWidth * dpr);
  canvas.height = Math.round(canvasHeight * dpr);

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Failed to create HTML5 Canvas 2D context');
  }

  // Scale for high DPI
  ctx.scale(dpr, dpr);

  // Background colors
  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const gridDotColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const cardBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';
  const edgeDefaultColor = isDarkMode ? '#475569' : '#cbd5e1';
  const edgeArrayColor = isDarkMode ? '#a855f7' : '#9333ea';

  // 1. Fill base background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Draw subtle dot grid if enabled
  if (includeGrid) {
    const gridSize = mode === 'viewport' ? Math.max(12, 24 * scale) : 24;
    const startX = mode === 'viewport' ? ((originX % gridSize) + gridSize) % gridSize : 0;
    const startY = mode === 'viewport' ? ((originY % gridSize) + gridSize) % gridSize : 0;

    ctx.fillStyle = gridDotColor;
    for (let gx = startX; gx < canvasWidth; gx += gridSize) {
      for (let gy = startY; gy < canvasHeight; gy += gridSize) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 3. Setup transformation matrix for the graph
  ctx.save();
  if (mode === 'viewport') {
    ctx.translate(originX, originY);
    ctx.scale(effectiveScale, effectiveScale);
  } else {
    ctx.translate(originX, originY);
  }

  // Build quick node lookup
  const nodesMap = new Map<string, FlowGraphNode>();
  nodes.forEach((n) => nodesMap.set(n.id, n));

  // 4. Draw curved Bézier connectors
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  edges.forEach((edge) => {
    const source = nodesMap.get(edge.sourceId);
    const target = nodesMap.get(edge.targetId);
    if (!source || !target) return;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = edge.sourceType === 'array' ? edgeArrayColor : edgeDefaultColor;

    if (direction === 'horizontal') {
      const x1 = source.x + source.width;
      const y1 = source.y + source.height / 2;
      const x2 = target.x;
      const y2 = target.y + target.height / 2;
      const dx = Math.max(30, (x2 - x1) * 0.45);
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);
    } else {
      const x1 = source.x + source.width / 2;
      const y1 = source.y + source.height;
      const x2 = target.x + target.width / 2;
      const y2 = target.y;
      const dy = Math.max(30, (y2 - y1) * 0.45);
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1, y1 + dy, x2, y2 - dy, x2, y2);
    }
    ctx.stroke();
  });

  // 5. Draw node cards with rich typography, shadows, icons, and badges
  nodes.forEach((node) => {
    const { x, y, width: w, height: h } = node;

    // Node accent color based on JSON data type
    let accentColor = '#3b82f6'; // Object - Blue
    if (node.type === 'array') accentColor = '#a855f7'; // Purple
    else if (node.type === 'string') accentColor = '#10b981'; // Green
    else if (node.type === 'number') accentColor = '#f59e0b'; // Amber
    else if (node.type === 'boolean') accentColor = '#06b6d4'; // Cyan
    else if (node.type === 'null') accentColor = '#94a3b8'; // Slate

    // Draw shadow
    ctx.save();
    ctx.shadowColor = isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // Card background fill
    ctx.fillStyle = cardBg;
    drawRoundedRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.restore();

    // Card border
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, x, y, w, h, 8);
    ctx.stroke();

    // Selection ring or Search highlight ring
    if (selectedNodeId === node.id) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      drawRoundedRect(ctx, x - 2, y - 2, w + 4, h + 4, 10);
      ctx.stroke();
    } else if (searchMatchNodeIds.has(node.id)) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, x - 1.5, y - 1.5, w + 3, h + 3, 9.5);
      ctx.stroke();
    }

    // Left accent bar
    ctx.fillStyle = accentColor;
    drawRoundedRect(ctx, x, y, 4, h, 2);
    ctx.fill();

    // Type vector icon on left
    drawTypeIcon(ctx, node.type, x + 14, y + 15, accentColor);

    // Display key name
    ctx.fillStyle = node.isArrayItem ? (isDarkMode ? '#c084fc' : '#9333ea') : textColor;
    ctx.font = '600 12px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    const keyText = truncateString(node.displayKey, 18);
    ctx.fillText(keyText, x + 28, y + 25);

    // Divider line between top and bottom half
    ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 38);
    ctx.lineTo(x + w - 6, y + 38);
    ctx.stroke();

    // Bottom row: Type label + children count or value
    ctx.fillStyle = mutedColor;
    ctx.font = '500 10.5px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

    let typeLabel = capitalize(node.type);
    if (node.type === 'object') {
      typeLabel += ` · ${node.childCount} ${node.childCount === 1 ? 'prop' : 'props'}`;
    } else if (node.type === 'array') {
      typeLabel += ` · ${node.childCount} ${node.childCount === 1 ? 'item' : 'items'}`;
    }
    ctx.fillText(typeLabel, x + 14, y + 56);

    // Value or collapsed indicator
    if (node.isLeaf) {
      ctx.fillStyle = accentColor;
      ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
      const valText = truncateString(node.previewValue, 13);
      const valWidth = ctx.measureText(valText).width;
      ctx.fillText(valText, x + w - valWidth - 12, y + 56);
    } else if (node.collapsed) {
      // Small "+N hidden" badge
      const badgeText = `+${node.childCount}`;
      ctx.font = '600 9.5px "JetBrains Mono", monospace';
      const bw = ctx.measureText(badgeText).width + 8;
      const bh = 14;
      const bx = x + w - bw - 10;
      const by = y + 46;

      ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
      drawRoundedRect(ctx, bx, by, bw, bh, 3);
      ctx.fill();

      ctx.fillStyle = mutedColor;
      ctx.fillText(badgeText, bx + 4, by + 10.5);
    }
  });

  ctx.restore();

  // 6. Watermark stamp in corner
  const brandingText = `JSON Flow Viewer · ${mode === 'viewport' ? 'Viewport Capture' : 'Full Map'}`;
  ctx.font = '500 10px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  ctx.fillText(brandingText, 16, canvasHeight - 12);

  // 7. Convert canvas to PNG blob and trigger download
  const targetFilename =
    filename ||
    `json-flow-${mode === 'viewport' ? 'viewport' : 'canvas'}-${Date.now()}.png`;

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = targetFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);

        resolve(targetFilename);
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Draws minimal vector icons matching the JSON data type directly on the canvas
 */
function drawTypeIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;

  if (type === 'object') {
    // Braces icon { }
    ctx.font = 'bold 11px monospace';
    ctx.fillText('{ }', x, y + 10);
  } else if (type === 'array') {
    // Brackets icon [ ]
    ctx.font = 'bold 11px monospace';
    ctx.fillText('[ ]', x, y + 10);
  } else if (type === 'string') {
    // Quote icon " "
    ctx.font = 'bold 12px serif';
    ctx.fillText('“', x + 1, y + 10);
  } else if (type === 'number') {
    // Hash symbol #
    ctx.font = 'bold 11px monospace';
    ctx.fillText('#', x, y + 10);
  } else if (type === 'boolean') {
    // Toggle pill shape
    ctx.beginPath();
    ctx.arc(x + 3, y + 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.arc(x + 9, y + 6, 3, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Null symbol
    ctx.font = 'bold 10px monospace';
    ctx.fillText('∅', x, y + 10);
  }

  ctx.restore();
}

/**
 * Helper to draw rounded rectangle with cross-browser compatibility
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }
}

function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength - 1) + '…' : str;
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Export Flow as SVG Vector
 */
export function exportFlowAsSvg(
  nodes: FlowGraphNode[],
  edges: FlowEdge[],
  direction: LayoutDirection,
  isDarkMode: boolean
): void {
  if (nodes.length === 0) return;

  const padding = 60;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  });

  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  const shiftX = -minX + padding;
  const shiftY = -minY + padding;

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const edgeColor = isDarkMode ? '#475569' : '#cbd5e1';

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: ${bgColor}; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  
  <g class="edges">
`;

  const nodesMap = new Map<string, FlowGraphNode>();
  nodes.forEach((n) => nodesMap.set(n.id, n));

  edges.forEach((edge) => {
    const source = nodesMap.get(edge.sourceId);
    const target = nodesMap.get(edge.targetId);
    if (!source || !target) return;

    const shiftedSource = { ...source, x: source.x + shiftX, y: source.y + shiftY };
    const shiftedTarget = { ...target, x: target.x + shiftX, y: target.y + shiftY };
    const pathD = getCurvedPath(shiftedSource, shiftedTarget, direction);

    svgContent += `    <path d="${pathD}" fill="none" stroke="${edgeColor}" stroke-width="2" stroke-linecap="round"/>\n`;
  });

  svgContent += `  </g>\n\n  <g class="nodes">\n`;

  nodes.forEach((n) => {
    const nx = n.x + shiftX;
    const ny = n.y + shiftY;
    const nw = n.width;
    const nh = n.height;

    let accentColor = '#3b82f6';
    if (n.type === 'array') accentColor = '#a855f7';
    else if (n.type === 'string') accentColor = '#10b981';
    else if (n.type === 'number') accentColor = '#f59e0b';
    else if (n.type === 'boolean') accentColor = '#06b6d4';
    else if (n.type === 'null') accentColor = '#94a3b8';

    const safeKey = escapeXml(n.displayKey);
    const safeValue = escapeXml(n.previewValue);
    const typeLabel = n.type.toUpperCase();

    svgContent += `
    <g transform="translate(${nx}, ${ny})">
      <rect width="${nw}" height="${nh}" rx="8" fill="${cardBg}" stroke="${borderColor}" stroke-width="1"/>
      <rect width="4" height="${nh}" rx="2" fill="${accentColor}"/>
      <text x="14" y="26" font-size="12" font-weight="600" fill="${textColor}">${safeKey}</text>
      <text x="14" y="46" font-size="10" font-weight="500" fill="${mutedColor}">${typeLabel}</text>
      <text x="${nw - 14}" y="46" text-anchor="end" font-size="11" font-family="monospace" fill="${accentColor}">${safeValue}</text>
    </g>`;
  });

  svgContent += `\n  </g>\n</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'json-flow-map.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
