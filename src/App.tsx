/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Code2, 
  Workflow, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Maximize2 
} from 'lucide-react';
import { 
  JsonParseResult, 
  LayoutDirection, 
  ToastMessage, 
  FlowGraphNode, 
  JsonStats 
} from './types';
import { validateAndParseJson, buildJsonGraph } from './utils/jsonParser';
import { SAMPLE_DATASETS, SampleItem } from './utils/samples';
import { Header } from './components/Header';
import { JsonEditor } from './components/JsonEditor';
import { FlowViewer } from './components/FlowViewer';
import { EmptyState } from './components/EmptyState';
import { Toast } from './components/Toast';
import { ShortcutsModal } from './components/ShortcutsModal';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('json_flow_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('json_flow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('json_flow_theme', 'light');
    }
  }, [isDarkMode]);

  // Layout flow direction
  const [direction, setDirection] = useState<LayoutDirection>('horizontal');

  // Desktop workspace panel collapse (can collapse editor to give 100% space to Flow Map)
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);

  // Mobile active tab ('editor' | 'flow')
  const [mobileTab, setMobileTab] = useState<'editor' | 'flow'>('flow');

  // Shortcuts modal
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial JSON state - loaded with sample
  const [jsonInput, setJsonInput] = useState<string>(() => {
    return JSON.stringify(SAMPLE_DATASETS[0].data, null, 2);
  });

  // Parse result (live validation of input)
  const parseResult: JsonParseResult = useMemo(() => {
    return validateAndParseJson(jsonInput);
  }, [jsonInput]);

  // Visualized graph state
  const [graphData, setGraphData] = useState<{
    nodes: Map<string, FlowGraphNode>;
    rootId: string;
    stats: JsonStats;
  } | null>(() => {
    try {
      return buildJsonGraph(SAMPLE_DATASETS[0].data);
    } catch {
      return null;
    }
  });

  // Action: Visualize JSON
  const handleVisualize = useCallback(() => {
    if (!parseResult.isValid || !parseResult.parsedData) {
      addToast('Please fix JSON syntax errors before visualizing', 'error');
      return;
    }

    try {
      const built = buildJsonGraph(parseResult.parsedData);
      setGraphData(built);
      addToast(`Visualized ${built.stats.totalNodes} nodes successfully`, 'success');
      // If on mobile, switch to Flow tab
      setMobileTab('flow');
    } catch (err: any) {
      addToast(`Failed to build graph: ${err.message}`, 'error');
    }
  }, [parseResult, addToast]);

  // Action: Load Sample
  const handleSelectSample = useCallback((sample: SampleItem) => {
    const formatted = JSON.stringify(sample.data, null, 2);
    setJsonInput(formatted);
    const built = buildJsonGraph(sample.data);
    setGraphData(built);
    addToast(`Loaded sample: ${sample.name}`, 'info');
    setMobileTab('flow');
  }, [addToast]);

  // Toggle layout direction
  const handleToggleDirection = () => {
    setDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
    addToast(
      direction === 'horizontal'
        ? 'Switched to Vertical Flow'
        : 'Switched to Horizontal Flow',
      'info'
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased font-sans">
      {/* Top Header */}
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        direction={direction}
        onToggleDirection={handleToggleDirection}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onSelectSample={(id) => {
          const sample = SAMPLE_DATASETS.find((s) => s.id === id);
          if (sample) handleSelectSample(sample);
        }}
      />

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center justify-around border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1.5 shrink-0 z-20">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mobileTab === 'editor'
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
          aria-label="Switch to JSON Editor"
        >
          <Code2 className="w-3.5 h-3.5 text-blue-500" />
          <span>JSON Editor</span>
        </button>

        <button
          onClick={() => setMobileTab('flow')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mobileTab === 'flow'
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
          aria-label="Switch to Flow Map"
        >
          <Workflow className="w-3.5 h-3.5 text-purple-500" />
          <span>Flow Map</span>
          {graphData && (
            <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
              ({graphData.stats.totalNodes})
            </span>
          )}
        </button>
      </div>

      {/* Main Workspace Split Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: JSON Editor */}
        <div
          className={`h-full border-r border-neutral-200 dark:border-neutral-800 transition-all duration-200 ${
            // Mobile responsive visibility
            mobileTab === 'editor' ? 'flex flex-col w-full' : 'hidden lg:flex flex-col'
          } ${
            // Desktop width control
            isEditorCollapsed ? 'lg:w-0 lg:hidden' : 'lg:w-[420px] xl:w-[480px] shrink-0'
          }`}
        >
          <JsonEditor
            value={jsonInput}
            onChange={setJsonInput}
            parseResult={parseResult}
            onVisualize={handleVisualize}
            onSelectSample={handleSelectSample}
            onShowToast={addToast}
          />
        </div>

        {/* Panel Collapse Toggle Button (Desktop only) */}
        <div className="hidden lg:flex items-center absolute left-0 top-1/2 -translate-y-1/2 z-30">
          <button
            onClick={() => setIsEditorCollapsed(!isEditorCollapsed)}
            style={{
              left: isEditorCollapsed ? '0px' : undefined,
              transform: isEditorCollapsed ? 'none' : 'translateX(-50%)',
            }}
            className={`p-1.5 rounded-r-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all ${
              isEditorCollapsed ? 'left-0 absolute' : ''
            }`}
            title={isEditorCollapsed ? 'Show JSON Editor' : 'Collapse JSON Editor'}
            aria-label={isEditorCollapsed ? 'Expand JSON Editor' : 'Collapse JSON Editor'}
          >
            {isEditorCollapsed ? (
              <PanelLeftOpen className="w-3.5 h-3.5 text-blue-500" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Right Panel: Interactive Flow Viewer Canvas */}
        <div
          className={`h-full flex-1 relative overflow-hidden ${
            mobileTab === 'flow' ? 'flex flex-col w-full' : 'hidden lg:flex flex-col'
          }`}
        >
          {graphData && graphData.nodes.size > 0 ? (
            <FlowViewer
              nodesMap={graphData.nodes}
              rootId={graphData.rootId}
              stats={graphData.stats}
              direction={direction}
              onToggleDirection={handleToggleDirection}
              isDarkMode={isDarkMode}
              onShowToast={addToast}
            />
          ) : (
            <EmptyState onSelectSample={handleSelectSample} />
          )}
        </div>
      </main>

      {/* Floating Notifications Toast */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
