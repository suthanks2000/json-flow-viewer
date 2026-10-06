import React from 'react';
import { 
  Sun, 
  Moon, 
  Workflow, 
  ArrowRightLeft, 
  ArrowUpDown, 
  Keyboard, 
  Github,
  Sparkles
} from 'lucide-react';
import { LayoutDirection } from '../types';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  direction: LayoutDirection;
  onToggleDirection: () => void;
  onOpenShortcuts: () => void;
  onSelectSample: (sampleId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  direction,
  onToggleDirection,
  onOpenShortcuts,
}) => {
  return (
    <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur px-4 md:px-6 flex items-center justify-between shrink-0 select-none z-30">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
          <Workflow className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
              JSON Flow Viewer
            </span>
          </div>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden sm:inline-block leading-none">
            Turn JSON into an interactive visual map
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation & Flow Layout Toggle */}
      <div className="hidden md:flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80">
        <button
          onClick={onToggleDirection}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            direction === 'horizontal'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
          title="Switch to Horizontal / Vertical tree flow"
          aria-label="Toggle flow layout direction"
        >
          {direction === 'horizontal' ? (
            <>
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
              <span>Horizontal Flow</span>
            </>
          ) : (
            <>
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-500" />
              <span>Vertical Flow</span>
            </>
          )}
        </button>
      </div>

      {/* Zone 3: Actions & Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenShortcuts}
          className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Keyboard Shortcuts"
          aria-label="View keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleTheme}
          className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title={isDarkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
          aria-label="Toggle dark/light theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
        </button>

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Source on GitHub"
          aria-label="GitHub repository"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
