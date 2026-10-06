import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Braces, 
  ListTree, 
  Quote, 
  Hash, 
  ToggleLeft, 
  Ban, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  CornerDownRight 
} from 'lucide-react';
import { FlowGraphNode } from '../types';

interface NodeDetailsPanelProps {
  node: FlowGraphNode | null;
  onClose: () => void;
  onToggleCollapse: (nodeId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  onClose,
  onToggleCollapse,
  onShowToast,
}) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedValue, setCopiedValue] = useState(false);

  if (!node) return null;

  const handleCopyPath = async () => {
    const textToCopy = node.path || '(root)';
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedPath(true);
      onShowToast(`Copied JSON path: ${textToCopy}`, 'success');
      setTimeout(() => setCopiedPath(false), 2000);
    } catch {
      onShowToast('Failed to copy path', 'error');
    }
  };

  const handleCopyValue = async () => {
    let textToCopy = '';
    if (node.isLeaf) {
      textToCopy = node.rawStringValue;
    } else {
      textToCopy = JSON.stringify(node.value, null, 2);
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedValue(true);
      onShowToast('Copied value to clipboard', 'success');
      setTimeout(() => setCopiedValue(false), 2000);
    } catch {
      onShowToast('Failed to copy value', 'error');
    }
  };

  const isContainer = node.type === 'object' || node.type === 'array';

  return (
    <div className="absolute right-4 top-16 bottom-4 w-80 md:w-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200 select-none">
      {/* Panel Header */}
      <div className="h-12 px-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-950/40 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Node Details
          </span>
          <span className="text-xs text-neutral-400">·</span>
          <span className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400 capitalize">
            {node.type}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close details panel"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Key Section */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Property Key
          </label>
          <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {node.displayKey}
          </div>
        </div>

        {/* JSON Path Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              JSON Path
            </label>
            <button
              onClick={handleCopyPath}
              className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {copiedPath ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Path</span>
                </>
              )}
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 font-mono text-xs text-neutral-700 dark:text-neutral-300 break-all">
            {node.path || '(root)'}
          </div>
        </div>

        {/* Value Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Value
            </label>
            {node.isLeaf && (
              <button
                onClick={handleCopyValue}
                className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copiedValue ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Value</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 font-mono text-xs max-h-48 overflow-y-auto whitespace-pre-wrap break-all text-neutral-800 dark:text-neutral-200">
            {node.isLeaf
              ? node.type === 'string'
                ? `"${node.value}"`
                : String(node.value)
              : `${node.type === 'object' ? 'Object' : 'Array'} containing ${node.childCount} ${
                  node.type === 'object' ? 'properties' : 'items'
                }`}
          </div>
        </div>

        {/* Structural Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px]">
          <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/60 dark:border-neutral-800/60">
            <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5">Hierarchy Depth</span>
            <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
              Level {node.depth}
            </span>
          </div>

          <div className="p-2 rounded bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/60 dark:border-neutral-800/60">
            <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5">Direct Children</span>
            <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
              {node.childCount}
            </span>
          </div>
        </div>

        {/* Expand / Collapse Control for branch */}
        {isContainer && (
          <div className="pt-2">
            <button
              onClick={() => onToggleCollapse(node.id)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg transition-colors"
            >
              {node.collapsed ? (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                  <span>Expand Subtree ({node.childCount} children)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                  <span>Collapse Subtree</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30 flex items-center gap-2">
        <button
          onClick={handleCopyPath}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Path</span>
        </button>
        {node.isLeaf && (
          <button
            onClick={handleCopyValue}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Value</span>
          </button>
        )}
      </div>
    </div>
  );
};
