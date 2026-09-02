import React from 'react';
import { cn } from '@/lib/utils/classnames';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center space-x-1 border-b border-surface-border', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center space-x-2 px-3.5 py-2.5 text-xs font-mono font-medium tracking-wide uppercase transition-colors border-b-2 -mb-px select-none',
              isActive
                ? 'border-blue-500 text-blue-400 bg-surface-muted/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700',
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded px-1.5 py-0.2 text-[10px] font-mono',
                  isActive ? 'bg-blue-950 text-blue-300' : 'bg-surface-subtle text-slate-400',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
