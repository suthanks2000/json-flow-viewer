import React from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Braces, 
  ListTree, 
  Quote, 
  Hash, 
  ToggleLeft, 
  Ban, 
  Layers
} from 'lucide-react';
import { FlowGraphNode, JsonDataType } from '../types';

interface NodeCardProps {
  node: FlowGraphNode;
  isSelected: boolean;
  isSearchMatch: boolean;
  isCurrentSearchMatch: boolean;
  onSelect: (node: FlowGraphNode) => void;
  onToggleCollapse: (nodeId: string) => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  isSearchMatch,
  isCurrentSearchMatch,
  onSelect,
  onToggleCollapse,
}) => {
  const hasChildren = node.childIds.length > 0;
  const isExpandable = node.type === 'object' || node.type === 'array';

  // Badge colors and icons depending on JSON data type
  const getTypeConfig = (type: JsonDataType) => {
    switch (type) {
      case 'object':
        return {
          icon: <Braces className="w-3.5 h-3.5 text-blue-500" />,
          accentBorder: 'border-l-blue-500',
          badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
          label: 'Object',
        };
      case 'array':
        return {
          icon: <ListTree className="w-3.5 h-3.5 text-purple-500" />,
          accentBorder: 'border-l-purple-500',
          badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
          label: 'Array',
        };
      case 'string':
        return {
          icon: <Quote className="w-3.5 h-3.5 text-emerald-500" />,
          accentBorder: 'border-l-emerald-500',
          badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
          label: 'String',
        };
      case 'number':
        return {
          icon: <Hash className="w-3.5 h-3.5 text-amber-500" />,
          accentBorder: 'border-l-amber-500',
          badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
          label: 'Number',
        };
      case 'boolean':
        return {
          icon: <ToggleLeft className="w-3.5 h-3.5 text-cyan-500" />,
          accentBorder: 'border-l-cyan-500',
          badgeBg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
          label: 'Boolean',
        };
      case 'null':
        return {
          icon: <Ban className="w-3.5 h-3.5 text-neutral-400" />,
          accentBorder: 'border-l-neutral-400',
          badgeBg: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
          label: 'Null',
        };
    }
  };

  const typeConfig = getTypeConfig(node.type);

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
        width: `${node.width}px`,
        height: `${node.height}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
      className={`group cursor-pointer select-none rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 border-l-[3.5px] ${
        typeConfig.accentBorder
      } shadow-xs hover:shadow-md transition-all duration-150 flex flex-col justify-between p-2.5 ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/20 dark:bg-blue-950/20'
          : ''
      } ${
        isCurrentSearchMatch
          ? 'ring-2 ring-amber-500 shadow-md bg-amber-50/30 dark:bg-amber-950/30'
          : isSearchMatch
          ? 'ring-1.5 ring-amber-400/80 bg-amber-50/15 dark:bg-amber-950/15'
          : ''
      }`}
    >
      {/* Node Top Row: Key name & Type Badge / Expand control */}
      <div className="flex items-center justify-between gap-1.5 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="shrink-0">{typeConfig.icon}</span>
          <span
            className={`text-xs font-semibold truncate ${
              node.isArrayItem
                ? 'font-mono text-purple-600 dark:text-purple-400'
                : 'text-neutral-900 dark:text-neutral-100'
            }`}
            title={node.path || node.displayKey}
          >
            {node.displayKey}
          </span>
        </div>

        {/* Expand / Collapse Button for Object & Array */}
        {isExpandable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(node.id);
            }}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors shrink-0"
            title={node.collapsed ? 'Expand branch' : 'Collapse branch'}
            aria-label={node.collapsed ? 'Expand branch' : 'Collapse branch'}
          >
            {node.collapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Node Bottom Row: Value or Child Count */}
      <div className="flex items-center justify-between text-[11px] gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
        <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 truncate">
          <span>{typeConfig.label}</span>
          {node.type === 'object' && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {node.childCount} {node.childCount === 1 ? 'prop' : 'props'}
              </span>
            </>
          )}
          {node.type === 'array' && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {node.childCount} {node.childCount === 1 ? 'item' : 'items'}
              </span>
            </>
          )}
        </div>

        {/* Primitive Value Preview or Collapsed Count */}
        {node.isLeaf ? (
          <span
            className={`font-mono text-[11px] truncate max-w-[100px] ${
              node.type === 'string'
                ? 'text-emerald-600 dark:text-emerald-400'
                : node.type === 'number'
                ? 'text-amber-600 dark:text-amber-400'
                : node.type === 'boolean'
                ? 'text-cyan-600 dark:text-cyan-400'
                : 'text-neutral-500 dark:text-neutral-400 italic'
            }`}
            title={node.rawStringValue}
          >
            {node.previewValue}
          </span>
        ) : (
          node.collapsed && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              +{node.childCount} hidden
            </span>
          )
        )}
      </div>
    </div>
  );
};
