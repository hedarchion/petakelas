
import React, { memo, useMemo } from 'react';
import { User, MonitorPlay, Eraser, ArrowDownUp, ArrowLeftRight, Grid3X3, LucideIcon } from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
}

interface ToolConfig {
  id: ToolType;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
}

const tools: ToolConfig[] = [
  { 
    id: 'student', 
    label: 'Students', 
    shortLabel: 'Student',
    icon: User,
    description: 'Add student seats'
  },
  { 
    id: 'teacher', 
    label: 'Teacher', 
    shortLabel: 'Teacher',
    icon: MonitorPlay,
    description: 'Add teacher desk'
  },
  { 
    id: 'merge', 
    label: 'Merge Cells', 
    shortLabel: 'Merge',
    icon: Grid3X3,
    description: 'Merge multiple cells'
  },
  { 
    id: 'corridor-vertical', 
    label: 'Corridor (V)', 
    shortLabel: 'Corridor V',
    icon: ArrowDownUp,
    description: 'Add vertical corridor'
  },
  { 
    id: 'corridor-horizontal', 
    label: 'Corridor (H)', 
    shortLabel: 'Corridor H',
    icon: ArrowLeftRight,
    description: 'Add horizontal corridor'
  },
  { 
    id: 'eraser', 
    label: 'Eraser', 
    shortLabel: 'Eraser',
    icon: Eraser,
    description: 'Remove cells'
  },
];

interface ToolButtonProps {
  tool: ToolConfig;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

const ToolButton = memo(({ tool, isActive, onClick, index }: ToolButtonProps) => {
  const Icon = tool.icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] lg:w-full py-2 lg:py-3 rounded-xl transition-all duration-200
        ${isActive 
          ? 'text-emerald-400 bg-emerald-500/10 lg:bg-transparent ring-1 ring-emerald-500/50' 
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}
        focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900
      `}
      aria-label={`${tool.description}${isActive ? ' (selected)' : ''}`}
      aria-pressed={isActive}
      title={`${tool.label}${isActive ? ' (selected)' : ''}`}
      tabIndex={0}
    >
      <div 
        className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'hover:scale-105'}`}
        aria-hidden="true"
      >
        <Icon className="w-5 h-5" />
      </div>
      
      <span className="text-[9px] sm:text-[10px] mt-1 sm:mt-1.5 font-bold uppercase tracking-wider text-center">
        {tool.label}
      </span>
    </button>
  );
});
ToolButton.displayName = 'ToolButton';

export const Toolbar: React.FC<ToolbarProps> = ({ currentTool, setTool }) => {
  const handleToolClick = (toolId: ToolType) => () => {
    setTool(toolId);
  };

  const toolButtons = useMemo(() => (
    tools.map((tool, index) => (
      <ToolButton
        key={tool.id}
        tool={tool}
        isActive={currentTool === tool.id}
        onClick={handleToolClick(tool.id)}
        index={index}
      />
    ))
  ), [currentTool]);

  return (
    <nav 
      className="flex lg:flex-col items-center justify-center lg:justify-start gap-1 sm:gap-2 lg:gap-4 p-2 sm:p-3 lg:px-2 lg:py-10 bg-zinc-900 border-t lg:border-t-0 lg:border-r border-zinc-800 w-full lg:w-20 xl:w-24 lg:h-full z-10 overflow-x-auto lg:overflow-x-visible"
      aria-label="Tools"
    >
      <div 
        className="hidden lg:block mb-8 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] text-center w-full pl-[0.2em]"
        aria-hidden="true"
      >
        Petakelas
      </div>
      
      <div 
        className="flex lg:flex-col gap-1 sm:gap-2 lg:gap-0"
        role="toolbar"
        aria-label="Seating plan tools"
      >
        {toolButtons}
      </div>
    </nav>
  );
};
