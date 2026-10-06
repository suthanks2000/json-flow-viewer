import React from 'react';
import { Workflow, Sparkles, ArrowRight } from 'lucide-react';
import { SAMPLE_DATASETS, SampleItem } from '../utils/samples';

interface EmptyStateProps {
  onSelectSample: (sample: SampleItem) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectSample }) => {
  return (
    <div className="h-full w-full flex items-center justify-center p-6 select-none bg-neutral-50/50 dark:bg-neutral-950/50">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        {/* Visual Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5 shadow-xs">
          <Workflow className="w-8 h-8" />
        </div>

        {/* Heading & Subtitle */}
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight mb-2">
          Paste your JSON to visualize it
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
          Turn complex JSON structures into a clear interactive flow map. Easily understand hierarchy, inspect values, and navigate nested data.
        </p>

        {/* Quick Sample CTA Buttons */}
        <div className="w-full flex flex-col gap-2">
          <div className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
            Try Sample Data
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_DATASETS.slice(0, 4).map((sample) => (
              <button
                key={sample.id}
                onClick={() => onSelectSample(sample)}
                className="flex items-center justify-between p-3 text-left bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xs transition-all group"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {sample.name}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {sample.badge}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
