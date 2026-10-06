import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Download, 
  Image as ImageIcon, 
  FileCode, 
  Layers, 
  ChevronsRight, 
  ChevronsDown, 
  ArrowRightLeft, 
  ArrowUpDown,
  Braces,
  ListTree,
  FolderOpen,
  FolderMinus,
  Sparkles,
  Camera,
  Loader2
} from 'lucide-react';
import { 
  FlowGraphNode, 
  FlowEdge, 
  LayoutDirection, 
  SearchMatch, 
  JsonStats 
} from '../types';
import { computeGraphLayout, getCurvedPath, LayoutResult } from '../utils/layoutEngine';
import { NodeCard } from './NodeCard';
import { NodeDetailsPanel } from './NodeDetailsPanel';
import { Minimap } from './Minimap';
import { captureFlowCanvasAsPng, exportFlowAsSvg } from '../utils/exportFlow';

interface FlowViewerProps {
  nodesMap: Map<string, FlowGraphNode>;
  rootId: string;
  stats: JsonStats | null;
  direction: LayoutDirection;
  onToggleDirection: () => void;
  isDarkMode: boolean;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const FlowViewer: React.FC<FlowViewerProps> = ({
  nodesMap,
  rootId,
  stats,
  direction,
  onToggleDirection,
  isDarkMode,
  onShowToast,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas pan & zoom state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 80, y: 80 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Viewport dimensions for fit-to-view and minimap
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });

  // Node selection & collapsed states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [collapsedSet, setCollapsedSet] = useState<Set<string>>(new Set());

  // PNG Capture state
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCaptureMenu, setShowCaptureMenu] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Measure container dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setViewportSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute graph layout whenever nodes, collapsed set, or direction changes
  const layoutResult: LayoutResult = useMemo(() => {
    return computeGraphLayout(nodesMap, rootId, direction, collapsedSet);
  }, [nodesMap, rootId, direction, collapsedSet]);

  const { positionedNodes, edges, bounds } = layoutResult;

  // Selected node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return positionedNodes.find((n) => n.id === selectedNodeId) || nodesMap.get(selectedNodeId) || null;
  }, [selectedNodeId, positionedNodes, nodesMap]);

  // Search matches calculation
  const searchMatches = useMemo<SearchMatch[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const matches: SearchMatch[] = [];
    nodesMap.forEach((node) => {
      const matchKey = node.displayKey.toLowerCase().includes(query);
      const matchVal = node.isLeaf && String(node.value).toLowerCase().includes(query);
      const matchPath = node.path.toLowerCase().includes(query);

      if (matchKey) {
        matches.push({ nodeId: node.id, matchField: 'key', path: node.path });
      } else if (matchVal) {
        matches.push({ nodeId: node.id, matchField: 'value', path: node.path });
      } else if (matchPath) {
        matches.push({ nodeId: node.id, matchField: 'path', path: node.path });
      }
    });

    return matches;
  }, [searchQuery, nodesMap]);

  // Center on node helper
  const centerOnNode = useCallback((node: FlowGraphNode) => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;

    const targetX = -(node.x * scale) + cw / 2 - (node.width * scale) / 2;
    const targetY = -(node.y * scale) + ch / 2 - (node.height * scale) / 2;

    setPan({ x: targetX, y: targetY });
  }, [scale]);

  // Navigate through search matches
  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    const match = searchMatches[nextIdx];
    const node = positionedNodes.find((n) => n.id === match.nodeId) || nodesMap.get(match.nodeId);
    if (node) {
      // If node is inside a collapsed branch, expand its parents
      ensureNodeVisible(node);
      centerOnNode(node);
      setSelectedNodeId(node.id);
    }
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    const match = searchMatches[prevIdx];
    const node = positionedNodes.find((n) => n.id === match.nodeId) || nodesMap.get(match.nodeId);
    if (node) {
      ensureNodeVisible(node);
      centerOnNode(node);
      setSelectedNodeId(node.id);
    }
  };

  // Expand parent hierarchy to make node visible
  const ensureNodeVisible = (node: FlowGraphNode) => {
    let curr: FlowGraphNode | null = node;
    const toUncollapse: string[] = [];

    while (curr && curr.parentId) {
      if (collapsedSet.has(curr.parentId)) {
        toUncollapse.push(curr.parentId);
      }
      curr = nodesMap.get(curr.parentId) || null;
    }

    if (toUncollapse.length > 0) {
      setCollapsedSet((prev) => {
        const next = new Set(prev);
        toUncollapse.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  // Keyboard shortcut listener (Cmd+K for search, Esc to close details)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleCapturePng('viewport', 2);
      } else if (e.key === 'Escape') {
        if (selectedNodeId) {
          setSelectedNodeId(null);
        } else if (searchQuery) {
          setSearchQuery('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, searchQuery]);

  // Fit graph into visible screen
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || positionedNodes.length === 0) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;

    const graphWidth = bounds.width;
    const graphHeight = bounds.height;

    const padding = 100;
    const scaleX = (cw - padding) / Math.max(graphWidth, 200);
    const scaleY = (ch - padding) / Math.max(graphHeight, 200);

    const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1.2);
    setScale(fitScale);

    // Center layout
    const newPanX = (cw - graphWidth * fitScale) / 2 - bounds.minX * fitScale;
    const newPanY = (ch - graphHeight * fitScale) / 2 - bounds.minY * fitScale;

    setPan({ x: newPanX, y: newPanY });
  }, [bounds, positionedNodes.length]);

  // Initial fit to screen once loaded
  useEffect(() => {
    if (positionedNodes.length > 0) {
      handleFitToScreen();
    }
  }, [rootId]);

  // Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(s * 1.25, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.25, 0.2));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 80, y: 80 });
  };

  // Expand / Collapse all
  const handleExpandAll = () => {
    setCollapsedSet(new Set());
    onShowToast('Expanded all nodes', 'info');
  };

  const handleCollapseAll = () => {
    const newSet = new Set<string>();
    nodesMap.forEach((n) => {
      if (n.childIds.length > 0 && n.id !== rootId) {
        newSet.add(n.id);
      }
    });
    setCollapsedSet(newSet);
    onShowToast('Collapsed all nested branches', 'info');
  };

  // Toggle single branch
  const handleToggleCollapse = (nodeId: string) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsPanning(true);
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Wheel zoom centered around cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.15), 2.5);

    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // Adjust pan to zoom towards pointer
    const newPanX = cursorX - (cursorX - pan.x) * (newScale / scale);
    const newPanY = cursorY - (cursorY - pan.y) * (newScale / scale);

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  // HTML5 Canvas PNG Export handler
  const handleCapturePng = async (mode: 'viewport' | 'full' = 'viewport', resolutionScale: number = 2) => {
    if (isCapturing) return;
    setIsCapturing(true);
    setShowCaptureMenu(false);
    try {
      const filename = await captureFlowCanvasAsPng({
        nodes: positionedNodes,
        edges,
        direction,
        isDarkMode,
        mode,
        pan,
        scale,
        viewportWidth: viewportSize.width,
        viewportHeight: viewportSize.height,
        selectedNodeId,
        searchMatchNodeIds,
        resolutionScale,
        includeGrid: true,
      });
      onShowToast(`Downloaded PNG: ${filename}`, 'success');
    } catch (err: any) {
      onShowToast(`Capture failed: ${err.message}`, 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleExportSvg = () => {
    exportFlowAsSvg(positionedNodes, edges, direction, isDarkMode);
    onShowToast('Exported Flow as SVG vector', 'success');
  };

  // Search match node lookup map
  const searchMatchNodeIds = useMemo(() => {
    return new Set(searchMatches.map((m) => m.nodeId));
  }, [searchMatches]);

  const currentMatchNodeId = searchMatches[currentMatchIndex]?.nodeId;

  // Nodes map for rendering connectors
  const nodesLookup = useMemo(() => {
    const map = new Map<string, FlowGraphNode>();
    positionedNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [positionedNodes]);

  return (
    <div className="relative flex flex-col h-full bg-neutral-100/50 dark:bg-neutral-950/70 overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 px-3 flex items-center justify-between gap-2 shrink-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur z-20">
        {/* Left: Title & Quick Stats */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Flow Map
          </span>

          {stats && (
            <div className="hidden xl:flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono tabular-nums">
              <span>{stats.objectCount} obj</span>
              <span>·</span>
              <span>{stats.arrayCount} arr</span>
              <span>·</span>
              <span>{stats.keyCount} keys</span>
              <span>·</span>
              <span>depth {stats.maxDepth}</span>
            </div>
          )}
        </div>

        {/* Center: Search input */}
        <div className="flex items-center gap-1.5 flex-1 max-w-xs sm:max-w-sm mx-2">
          <div className="relative w-full flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentMatchIndex(0);
              }}
              placeholder="Search keys, values, paths... (⌘K)"
              className="w-full pl-8 pr-16 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-100 outline-none focus:ring-1.5 focus:ring-blue-500 focus:bg-white dark:focus:bg-neutral-900 transition-all font-mono"
            />
            {searchQuery && (
              <div className="absolute right-1 flex items-center gap-0.5">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono tabular-nums px-1">
                  {searchMatches.length > 0
                    ? `${currentMatchIndex + 1}/${searchMatches.length}`
                    : '0'}
                </span>
                <button
                  onClick={handlePrevMatch}
                  disabled={searchMatches.length === 0}
                  className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400 disabled:opacity-30"
                  aria-label="Previous match"
                  title="Previous match"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={handleNextMatch}
                  disabled={searchMatches.length === 0}
                  className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400 disabled:opacity-30"
                  aria-label="Next match"
                  title="Next match"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-md p-0.5 border border-neutral-200/80 dark:border-neutral-700/80">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 transition-colors"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded hover:bg-white dark:hover:bg-neutral-700 transition-colors tabular-nums"
              title="Reset Zoom to 100%"
              aria-label="Reset zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 transition-colors"
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fit to View */}
          <button
            onClick={handleFitToScreen}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors"
            title="Fit to Screen"
            aria-label="Fit to screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Expand / Collapse All */}
          <button
            onClick={handleExpandAll}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors"
            title="Expand All Branches"
            aria-label="Expand all nodes"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCollapseAll}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors"
            title="Collapse All Nested Branches"
            aria-label="Collapse all nodes"
          >
            <FolderMinus className="w-3.5 h-3.5" />
          </button>

          {/* Export & Canvas Capture Actions */}
          <div className="relative flex items-center ml-1">
            <div className="inline-flex rounded-md shadow-2xs">
              <button
                onClick={() => handleCapturePng('viewport', 2)}
                disabled={isCapturing}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-l-md transition-colors disabled:opacity-50 cursor-pointer"
                title="Capture Current Canvas Viewport as High-Quality PNG (HTML5 Canvas)"
                aria-label="Capture Canvas PNG"
              >
                {isCapturing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>Capture PNG</span>
              </button>

              <button
                onClick={() => setShowCaptureMenu(!showCaptureMenu)}
                disabled={isCapturing}
                className="px-1.5 py-1 text-white bg-blue-700 hover:bg-blue-600 border-l border-blue-500/40 rounded-r-md transition-colors disabled:opacity-50 cursor-pointer"
                title="Capture and Export Options"
                aria-label="Open export options"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* PNG Capture & Export Menu */}
            {showCaptureMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCaptureMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-68 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 select-none">
                  <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    HTML5 Canvas PNG Capture
                  </div>

                  <button
                    onClick={() => handleCapturePng('viewport', 2)}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 flex flex-col gap-0.5 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      <Camera className="w-3.5 h-3.5 text-blue-500" />
                      <span>Current Viewport (PNG)</span>
                    </div>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Exact current canvas state (zoom & pan framed)
                    </span>
                  </button>

                  <button
                    onClick={() => handleCapturePng('full', 2)}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 flex flex-col gap-0.5 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Full Flow Map (2x Retina PNG)</span>
                    </div>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      High-resolution capture of all visible nodes
                    </span>
                  </button>

                  <button
                    onClick={() => handleCapturePng('full', 3)}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 flex flex-col gap-0.5 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Full Flow Map (3x Ultra HD PNG)</span>
                    </div>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Maximum clarity print-ready resolution
                    </span>
                  </button>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />

                  <button
                    onClick={() => {
                      setShowCaptureMenu(false);
                      handleExportSvg();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 flex flex-col gap-0.5 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      <FileCode className="w-3.5 h-3.5 text-purple-500" />
                      <span>Export Vector SVG</span>
                    </div>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Infinitely scalable vector graphic format
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing ${
          isPanning ? 'cursor-grabbing' : ''
        }`}
        style={{
          // Subtle dot grid background
          backgroundImage: isDarkMode
            ? 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)'
            : 'radial-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px)',
          backgroundSize: `${24 * scale}px ${24 * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Transformable Canvas Content */}
        <div
          style={{
            position: 'absolute',
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            pointerEvents: 'auto',
          }}
        >
          {/* SVG Connector Lines Layer */}
          <svg
            className="absolute top-0 left-0 overflow-visible pointer-events-none"
            style={{ width: '1px', height: '1px' }}
          >
            <defs>
              <linearGradient id="edge-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="edge-grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {edges.map((edge) => {
              const source = nodesLookup.get(edge.sourceId);
              const target = nodesLookup.get(edge.targetId);
              if (!source || !target) return null;

              const pathD = getCurvedPath(source, target, direction);
              const strokeColor =
                edge.sourceType === 'array'
                  ? 'url(#edge-grad-purple)'
                  : isDarkMode
                  ? '#475569'
                  : '#cbd5e1';

              return (
                <path
                  key={edge.id}
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />
              );
            })}
          </svg>

          {/* Node Cards Layer */}
          {positionedNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isSearchMatch={searchMatchNodeIds.has(node.id)}
              isCurrentSearchMatch={currentMatchNodeId === node.id}
              onSelect={(n) => setSelectedNodeId(n.id)}
              onToggleCollapse={handleToggleCollapse}
            />
          ))}
        </div>

        {/* Floating Node Details Panel */}
        {selectedNode && (
          <NodeDetailsPanel
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onToggleCollapse={handleToggleCollapse}
            onShowToast={onShowToast}
          />
        )}

        {/* Interactive Minimap */}
        <Minimap
          nodes={positionedNodes}
          bounds={bounds}
          scale={scale}
          panX={pan.x}
          panY={pan.y}
          viewportWidth={viewportSize.width}
          viewportHeight={viewportSize.height}
          onPanTo={(newX, newY) => setPan({ x: newX, y: newY })}
        />
      </div>
    </div>
  );
};
