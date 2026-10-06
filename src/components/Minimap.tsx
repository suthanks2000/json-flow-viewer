import React, { useRef } from 'react';
import { FlowGraphNode } from '../types';
import { LayoutResult } from '../utils/layoutEngine';

interface MinimapProps {
  nodes: FlowGraphNode[];
  bounds: LayoutResult['bounds'];
  scale: number;
  panX: number;
  panY: number;
  viewportWidth: number;
  viewportHeight: number;
  onPanTo: (x: number, y: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  nodes,
  bounds,
  scale,
  panX,
  panY,
  viewportWidth,
  viewportHeight,
  onPanTo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (nodes.length < 5) return null; // Don't show for tiny structures

  const MINIMAP_WIDTH = 180;
  const MINIMAP_HEIGHT = 120;
  const PADDING = 20;

  const graphWidth = Math.max(bounds.width, 200) + PADDING * 2;
  const graphHeight = Math.max(bounds.height, 200) + PADDING * 2;

  const scaleRatioX = MINIMAP_WIDTH / graphWidth;
  const scaleRatioY = MINIMAP_HEIGHT / graphHeight;
  const miniScale = Math.min(scaleRatioX, scaleRatioY);

  // Convert graph coord to minimap coord
  const toMiniX = (x: number) => (x - bounds.minX + PADDING) * miniScale;
  const toMiniY = (y: number) => (y - bounds.minY + PADDING) * miniScale;

  // Viewport rect in graph space
  const viewX1 = -panX / scale;
  const viewY1 = -panY / scale;
  const viewWidth = viewportWidth / scale;
  const viewHeight = viewportHeight / scale;

  const miniViewX = Math.max(0, toMiniX(viewX1));
  const miniViewY = Math.max(0, toMiniY(viewY1));
  const miniViewW = Math.min(MINIMAP_WIDTH, viewWidth * miniScale);
  const miniViewH = Math.min(MINIMAP_HEIGHT, viewHeight * miniScale);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap coord back to graph space
    const targetGraphX = clickX / miniScale + bounds.minX - PADDING;
    const targetGraphY = clickY / miniScale + bounds.minY - PADDING;

    // Center in viewport
    const newPanX = -(targetGraphX * scale) + viewportWidth / 2;
    const newPanY = -(targetGraphY * scale) + viewportHeight / 2;

    onPanTo(newPanX, newPanY);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{ width: `${MINIMAP_WIDTH}px`, height: `${MINIMAP_HEIGHT}px` }}
      className="absolute bottom-4 right-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg overflow-hidden cursor-crosshair z-10 select-none group"
      title="Minimap: click to navigate"
    >
      <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} className="w-full h-full">
        {/* Render dots / boxes for nodes */}
        {nodes.map((node) => {
          const mx = toMiniX(node.x);
          const my = toMiniY(node.y);
          const mw = Math.max(3, node.width * miniScale);
          const mh = Math.max(2, node.height * miniScale);

          let fill = '#94a3b8';
          if (node.type === 'object') fill = '#3b82f6';
          else if (node.type === 'array') fill = '#a855f7';
          else if (node.type === 'string') fill = '#10b981';
          else if (node.type === 'number') fill = '#f59e0b';
          else if (node.type === 'boolean') fill = '#06b6d4';

          return (
            <rect
              key={node.id}
              x={mx}
              y={my}
              width={mw}
              height={mh}
              rx={1}
              fill={fill}
              opacity={0.7}
            />
          );
        })}

        {/* Viewport Box */}
        <rect
          x={miniViewX}
          y={miniViewY}
          width={miniViewW}
          height={miniViewH}
          fill="rgba(59, 130, 246, 0.15)"
          stroke="#3b82f6"
          strokeWidth={1.5}
          rx={2}
        />
      </svg>
      <div className="absolute top-1 left-1.5 text-[9px] font-mono text-neutral-400 select-none pointer-events-none">
        MAP
      </div>
    </div>
  );
};
