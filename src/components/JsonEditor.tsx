import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Code2, 
  Sparkles, 
  Trash2, 
  Copy, 
  Download, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Minimize2, 
  FileText, 
  Wand2,
  ChevronDown
} from 'lucide-react';
import { JsonParseResult } from '../types';
import { SAMPLE_DATASETS, SampleItem } from '../utils/samples';
import { tryRepairJson } from '../utils/jsonParser';

interface JsonEditorProps {
  value: string;
  onChange: (val: string) => void;
  parseResult: JsonParseResult;
  onVisualize: () => void;
  onSelectSample: (sample: SampleItem) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  parseResult,
  onVisualize,
  onSelectSample,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value.split(/\r?\n/);
  const lineCount = Math.max(lines.length, 1);
  const charCount = value.length;

  // Sync scroll between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Support Tab key to insert 2 spaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);

      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onVisualize();
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      onShowToast('JSON formatted successfully', 'success');
    } catch {
      onShowToast('Cannot format invalid JSON. Check errors below.', 'error');
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(value);
      const minified = JSON.stringify(parsed);
      onChange(minified);
      onShowToast('JSON minified to single line', 'success');
    } catch {
      onShowToast('Cannot minify invalid JSON', 'error');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onShowToast('JSON copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([value], { type: 'application/json' });
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

  const handleClear = () => {
    onChange('');
    onShowToast('Editor cleared', 'info');
  };

  const handleAutoRepair = () => {
    const repaired = tryRepairJson(value);
    try {
      JSON.parse(repaired);
      onChange(repaired);
      onShowToast('Repaired common syntax issues (e.g. trailing commas)', 'success');
    } catch {
      onChange(repaired);
      onShowToast('Applied auto-cleanup. Review remaining errors.', 'info');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden select-none">
      {/* Top Bar */}
      <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 px-3 flex items-center justify-between gap-2 shrink-0 bg-neutral-50/70 dark:bg-neutral-900/70">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            <Code2 className="w-4 h-4 text-neutral-500" />
            <span>JSON Input</span>
          </div>

          {/* Sample Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSamplesMenu(!showSamplesMenu)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-2xs"
              aria-label="Select sample JSON"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Samples</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showSamplesMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSamplesMenu(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-700">
                    Sample Datasets
                  </div>
                  {SAMPLE_DATASETS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => {
                        onSelectSample(sample);
                        setShowSamplesMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 flex flex-col gap-0.5 transition-colors border-b last:border-b-0 border-neutral-100 dark:border-neutral-700/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                          {sample.name}
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                          {sample.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {sample.description}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Toolbar action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleFormat}
            disabled={!value.trim()}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Format / Pretty-print JSON (Ctrl+Shift+F)"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Format</span>
          </button>

          <button
            onClick={handleMinify}
            disabled={!value.trim()}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Minify to single line"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Minify</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!value.trim()}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Copy JSON to clipboard"
            aria-label="Copy JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            disabled={!value.trim()}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Download as data.json"
            aria-label="Download JSON file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClear}
            disabled={!value.trim()}
            className="p-1.5 text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Clear editor"
            aria-label="Clear editor content"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-[13px] bg-neutral-50/30 dark:bg-neutral-950/40">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="w-12 py-3 bg-neutral-100/60 dark:bg-neutral-900/80 border-r border-neutral-200/60 dark:border-neutral-800/80 text-right pr-2 text-neutral-400 dark:text-neutral-600 select-none overflow-hidden leading-[20px] font-mono text-[12px] tabular-nums"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }).map((_, i) => {
            const isErrorLine = parseResult.error?.line === i + 1;
            return (
              <div
                key={i}
                className={`${isErrorLine ? 'text-red-500 font-bold bg-red-100/60 dark:bg-red-900/30 -mr-2 pr-2' : ''}`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* Text Area */}
        <div className="relative flex-1 h-full overflow-hidden">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder={`Paste any JSON here, or click "Samples" above...\n\nExample:\n{\n  "user": {\n    "name": "John Doe",\n    "skills": ["React", "TypeScript"]\n  }\n}`}
            spellCheck={false}
            className="w-full h-full p-3 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-[13px] leading-[20px] resize-none outline-none border-none focus:ring-0 selection:bg-blue-500/25 dark:selection:bg-blue-600/30 whitespace-pre overflow-auto"
            aria-label="JSON Code Input"
          />
        </div>
      </div>

      {/* Error Banner if invalid */}
      {!parseResult.isValid && value.trim() && parseResult.error && (
        <div className="border-t border-red-200 dark:border-red-900/60 bg-red-50/90 dark:bg-red-950/40 p-3 flex flex-col gap-1.5 shrink-0 animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-red-900 dark:text-red-200">
                  Invalid JSON:
                </span>{' '}
                <span className="text-xs text-red-800 dark:text-red-300">
                  {parseResult.error.message}
                </span>
                {parseResult.error.snippet && (
                  <div className="mt-1 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/50 text-[11px] font-mono text-red-950 dark:text-red-200 truncate max-w-sm">
                    {parseResult.error.snippet}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAutoRepair}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-200 hover:bg-red-200/60 dark:hover:bg-red-900/60 rounded border border-red-300 dark:border-red-800 transition-colors whitespace-nowrap shrink-0"
              title="Attempt to remove trailing commas or quote syntax"
            >
              <Wand2 className="w-3 h-3 text-red-600 dark:text-red-400" />
              <span>Auto-Fix</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Bar & Primary CTA */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/90 dark:bg-neutral-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            {parseResult.isValid ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Valid JSON</span>
              </>
            ) : value.trim() ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span className="font-medium text-red-600 dark:text-red-400">Syntax Error</span>
              </>
            ) : (
              <span>Ready for input</span>
            )}
          </div>
          <span>·</span>
          <span>{lineCount} lines</span>
          <span>·</span>
          <span>{charCount.toLocaleString()} chars</span>
        </div>

        {/* Big Visualize Button */}
        <button
          onClick={onVisualize}
          disabled={!value.trim() || !parseResult.isValid}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm shadow-blue-500/20 transition-all disabled:opacity-40 disabled:pointer-events-none hover:shadow-md cursor-pointer shrink-0"
          title="Convert JSON into visual interactive flow map (Cmd/Ctrl + Enter)"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Visualize JSON</span>
          <span className="text-[11px] opacity-75 font-mono hidden md:inline ml-1">⌘↵</span>
        </button>
      </div>
    </div>
  );
};
