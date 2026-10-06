import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Braces, 
  ListTree, 
  Quote, 
  Hash, 
  ToggleLeft, 
  Ban, 
  Copy, 
  Check, 
  Download, 
  Workflow, 
  Search,
  Sparkles,
  FilePlus,
  Layers,
  ArrowRight
} from 'lucide-react';
import { JsonDataType } from '../types';

interface JsonBuilderViewProps {
  data: any;
  onChange: (updatedData: any) => void;
  onVisualize: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const JsonBuilderView: React.FC<JsonBuilderViewProps> = ({
  data,
  onChange,
  onVisualize,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Helper to clone data cleanly
  const cloneData = (val: any) => JSON.parse(JSON.stringify(val));

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      onShowToast('JSON copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast('Failed to copy JSON', 'error');
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onShowToast('Downloaded data.json', 'success');
    } catch {
      onShowToast('Download failed', 'error');
    }
  };

  // Quick Start Templates
  const handleCreateNew = (type: 'object' | 'array') => {
    if (type === 'object') {
      onChange({
        name: "My Project",
        status: "active",
        priority: 1,
        enabled: true,
        items: ["Task 1", "Task 2"]
      });
      onShowToast('Created new sample JSON object', 'info');
    } else {
      onChange([
        { id: 1, name: "Item One", active: true },
        { id: 2, name: "Item Two", active: false }
      ]);
      onShowToast('Created new sample JSON array', 'info');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden select-none">
      {/* Top Header */}
      <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 px-3.5 flex items-center justify-between gap-2 shrink-0 bg-neutral-50/70 dark:bg-neutral-900/70">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Braces className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-none">
              Easy JSON Builder
            </h3>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-none">
              Edit & create JSON visually without syntax errors
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
            title="Copy formatted JSON"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">Copy</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
            title="Download JSON file"
            aria-label="Download JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onVisualize}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
            title="Visualize current JSON in Flow Map"
          >
            <Workflow className="w-3 h-3" />
            <span>Flow Map</span>
          </button>
        </div>
      </div>

      {/* Search & Quick Actions bar */}
      <div className="p-2.5 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-950/30 flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fields or values..."
            className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleCreateNew('object')}
            className="px-2 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 transition-colors whitespace-nowrap"
            title="Start new Object"
          >
            + Object
          </button>
          <button
            onClick={() => handleCreateNew('array')}
            className="px-2 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 transition-colors whitespace-nowrap"
            title="Start new Array"
          >
            + Array
          </button>
        </div>
      </div>

      {/* Main Builder Tree Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {data === undefined || data === null ? (
          <div className="p-6 text-center text-xs text-neutral-500">
            No JSON data loaded. Click "+ Object" or "+ Array" above to start building!
          </div>
        ) : (
          <BuilderNode
            keyName="(root)"
            value={data}
            path=""
            isRoot={true}
            searchQuery={searchQuery}
            onChangeRoot={(newVal) => onChange(newVal)}
            onShowToast={onShowToast}
          />
        )}
      </div>
    </div>
  );
};

interface BuilderNodeProps {
  keyName: string;
  value: any;
  path: string;
  isRoot?: boolean;
  isArrayItem?: boolean;
  arrayIndex?: number;
  searchQuery?: string;
  onChangeRoot: (updated: any) => void;
  onDelete?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const BuilderNode: React.FC<BuilderNodeProps> = ({
  keyName,
  value,
  path,
  isRoot = false,
  isArrayItem = false,
  arrayIndex,
  searchQuery = '',
  onChangeRoot,
  onDelete,
  onShowToast,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldType, setNewFieldType] = useState<JsonDataType>('string');
  const [newFieldValue, setNewFieldValue] = useState('');

  // Determine current node type
  const getType = (val: any): JsonDataType => {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    const t = typeof val;
    if (t === 'object') return 'object';
    if (t === 'string') return 'string';
    if (t === 'number') return 'number';
    if (t === 'boolean') return 'boolean';
    return 'string';
  };

  const currentType = getType(value);

  // Type color configuration
  const getTypeBadge = (type: JsonDataType) => {
    switch (type) {
      case 'object':
        return { text: 'Object', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60' };
      case 'array':
        return { text: 'Array', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900/60' };
      case 'string':
        return { text: 'String', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60' };
      case 'number':
        return { text: 'Number', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60' };
      case 'boolean':
        return { text: 'Boolean', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-900/60' };
      case 'null':
        return { text: 'Null', color: 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700' };
    }
  };

  // Type changer
  const handleTypeChange = (newType: JsonDataType) => {
    let defaultValue: any = '';
    if (newType === 'object') defaultValue = {};
    else if (newType === 'array') defaultValue = [];
    else if (newType === 'number') defaultValue = 0;
    else if (newType === 'boolean') defaultValue = true;
    else if (newType === 'null') defaultValue = null;
    else defaultValue = 'Text';

    onChangeRoot(defaultValue);
    onShowToast(`Changed type to ${newType}`, 'info');
  };

  // Add field to object
  const handleAddFieldToObject = () => {
    if (!newFieldKey.trim()) {
      onShowToast('Please provide a field key', 'error');
      return;
    }
    const updated = { ...(value || {}) };
    let val: any = newFieldValue;
    if (newFieldType === 'number') val = Number(newFieldValue) || 0;
    else if (newFieldType === 'boolean') val = newFieldValue === 'true';
    else if (newFieldType === 'object') val = {};
    else if (newFieldType === 'array') val = [];
    else if (newFieldType === 'null') val = null;

    updated[newFieldKey.trim()] = val;
    onChangeRoot(updated);
    setIsAddingField(false);
    setNewFieldKey('');
    setNewFieldValue('');
    onShowToast(`Added field "${newFieldKey}"`, 'success');
  };

  // Add item to array
  const handleAddItemToArray = () => {
    const updated = [...(value || [])];
    updated.push("New Item");
    onChangeRoot(updated);
    onShowToast('Added item to array', 'success');
  };

  // Update object property
  const handleUpdateProperty = (propKey: string, newPropVal: any) => {
    const updated = { ...value, [propKey]: newPropVal };
    onChangeRoot(updated);
  };

  // Delete object property
  const handleDeleteProperty = (propKey: string) => {
    const updated = { ...value };
    delete updated[propKey];
    onChangeRoot(updated);
    onShowToast(`Deleted "${propKey}"`, 'info');
  };

  // Update array item
  const handleUpdateArrayItem = (index: number, newItemVal: any) => {
    const updated = [...value];
    updated[index] = newItemVal;
    onChangeRoot(updated);
  };

  // Delete array item
  const handleDeleteArrayItem = (index: number) => {
    const updated = value.filter((_: any, i: number) => i !== index);
    onChangeRoot(updated);
    onShowToast(`Deleted item [${index}]`, 'info');
  };

  const badge = getTypeBadge(currentType);

  // Search filter matching
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const keyMatch = keyName.toLowerCase().includes(q);
    const valMatch = typeof value !== 'object' && String(value).toLowerCase().includes(q);
    if (!keyMatch && !valMatch && typeof value !== 'object') {
      return null;
    }
  }

  // 1. Primitive Node (String, Number, Boolean, Null)
  if (currentType !== 'object' && currentType !== 'array') {
    return (
      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Key name */}
          <span className={`text-xs font-semibold shrink-0 ${isArrayItem ? 'text-purple-600 dark:text-purple-400 font-mono' : 'text-neutral-800 dark:text-neutral-200'}`}>
            {isArrayItem ? `[${arrayIndex}]` : keyName}:
          </span>

          {/* Value Editor Input */}
          {currentType === 'boolean' ? (
            <button
              onClick={() => onChangeRoot(!value)}
              className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                value
                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                  : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700'
              }`}
            >
              {value ? 'true' : 'false'}
            </button>
          ) : currentType === 'null' ? (
            <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500 italic">
              null
            </span>
          ) : currentType === 'number' ? (
            <input
              type="number"
              value={value}
              onChange={(e) => onChangeRoot(Number(e.target.value))}
              className="px-2 py-0.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-amber-600 dark:text-amber-400 w-28 outline-none focus:ring-1 focus:ring-amber-500"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChangeRoot(e.target.value)}
              className="px-2 py-0.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-emerald-600 dark:text-emerald-400 flex-1 min-w-[120px] outline-none focus:ring-1 focus:ring-emerald-500 truncate"
            />
          )}
        </div>

        {/* Right Type Selector & Delete */}
        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={currentType}
            onChange={(e) => handleTypeChange(e.target.value as JsonDataType)}
            className="text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5 text-neutral-600 dark:text-neutral-300 outline-none cursor-pointer"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="null">Null</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>

          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity"
              title="Delete field"
              aria-label="Delete field"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Container Node (Object or Array)
  const childKeys = currentType === 'object' ? Object.keys(value || {}) : [];
  const arrayLength = currentType === 'array' ? (value as any[]).length : 0;
  const countText = currentType === 'object' ? `${childKeys.length} properties` : `${arrayLength} items`;

  return (
    <div className="rounded-lg border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 overflow-hidden shadow-2xs">
      {/* Node Header Row */}
      <div className="flex items-center justify-between p-2.5 bg-neutral-50/80 dark:bg-neutral-850 border-b border-neutral-200/70 dark:border-neutral-800">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-1.5 truncate">
            {currentType === 'object' ? (
              <Braces className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            ) : (
              <ListTree className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            )}
            <span className={`text-xs font-semibold truncate ${isArrayItem ? 'text-purple-600 dark:text-purple-400 font-mono' : 'text-neutral-900 dark:text-neutral-100'}`}>
              {isArrayItem ? `[${arrayIndex}]` : keyName}
            </span>
          </div>

          {/* Type Badge & count */}
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badge.color}`}>
            {badge.text} · {countText}
          </span>
        </div>

        {/* Action Buttons: Add Field, Type changer, Delete */}
        <div className="flex items-center gap-1 shrink-0">
          {currentType === 'object' ? (
            <button
              onClick={() => {
                setIsExpanded(true);
                setIsAddingField(true);
              }}
              className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 rounded text-[11px] font-medium transition-colors"
              title="Add property"
            >
              <Plus className="w-3 h-3" />
              <span>Add Field</span>
            </button>
          ) : (
            <button
              onClick={handleAddItemToArray}
              className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60 rounded text-[11px] font-medium transition-colors"
              title="Add item to array"
            >
              <Plus className="w-3 h-3" />
              <span>Add Item</span>
            </button>
          )}

          {!isRoot && onDelete && (
            <button
              onClick={onDelete}
              className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
              title="Delete container"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Container Body */}
      {isExpanded && (
        <div className="p-2.5 space-y-2 bg-neutral-50/20 dark:bg-neutral-900/20">
          {/* Add Field Inline Box */}
          {isAddingField && currentType === 'object' && (
            <div className="p-2.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                <span>Add New Property</span>
                <button
                  onClick={() => setIsAddingField(false)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. email, age)"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  className="px-2 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />

                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as JsonDataType)}
                  className="px-2 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded outline-none cursor-pointer"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="object">Nested Object</option>
                  <option value="array">Array</option>
                  <option value="null">Null</option>
                </select>

                {newFieldType === 'string' && (
                  <input
                    type="text"
                    placeholder="Value..."
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="px-2 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded outline-none font-mono"
                  />
                )}

                {newFieldType === 'number' && (
                  <input
                    type="number"
                    placeholder="0"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="px-2 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded outline-none font-mono"
                  />
                )}

                {newFieldType === 'boolean' && (
                  <select
                    value={newFieldValue || 'true'}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="px-2 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded outline-none"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={handleAddFieldToObject}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
                >
                  Save Property
                </button>
              </div>
            </div>
          )}

          {/* Children: Object Properties */}
          {currentType === 'object' && (
            childKeys.length === 0 ? (
              <div className="text-center py-2 text-xs text-neutral-400 italic">
                Empty object. Click "+ Add Field" to add properties.
              </div>
            ) : (
              childKeys.map((k) => (
                <BuilderNode
                  key={k}
                  keyName={k}
                  value={value[k]}
                  path={path ? `${path}.${k}` : k}
                  searchQuery={searchQuery}
                  onChangeRoot={(newVal) => handleUpdateProperty(k, newVal)}
                  onDelete={() => handleDeleteProperty(k)}
                  onShowToast={onShowToast}
                />
              ))
            )
          )}

          {/* Children: Array Items */}
          {currentType === 'array' && (
            (value as any[]).length === 0 ? (
              <div className="text-center py-2 text-xs text-neutral-400 italic">
                Empty array. Click "+ Add Item" to add items.
              </div>
            ) : (
              (value as any[]).map((item, idx) => (
                <BuilderNode
                  key={idx}
                  keyName={`[${idx}]`}
                  value={item}
                  path={`${path}[${idx}]`}
                  isArrayItem={true}
                  arrayIndex={idx}
                  searchQuery={searchQuery}
                  onChangeRoot={(newVal) => handleUpdateArrayItem(idx, newVal)}
                  onDelete={() => handleDeleteArrayItem(idx)}
                  onShowToast={onShowToast}
                />
              ))
            )
          )}
        </div>
      )}
    </div>
  );
};
