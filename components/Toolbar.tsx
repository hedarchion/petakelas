
import React from 'react';
import { User, MonitorPlay, Eraser, ArrowDownUp, ArrowLeftRight, Grid3X3 } from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ currentTool, setTool }) => {
  const tools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'student', label: 'Students', icon: <User className="w-5 h-5" /> },
    { id: 'teacher', label: 'Teacher', icon: <MonitorPlay className="w-5 h-5" /> },
    { id: 'merge', label: 'Merge', icon: <Grid3X3 className="w-5 h-5" /> },
    { id: 'corridor-vertical', label: 'Corridor (V)', icon: <ArrowDownUp className="w-5 h-5" /> },
    { id: 'corridor-horizontal', label: 'Corridor (H)', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-5 h-5" /> },
  ];

  return (
    <div className="flex md:flex-col items-center justify-center md:justify-start gap-1 md:gap-4 p-2 md:px-2 md:py-10 bg-zinc-900 border-t md:border-t-0 md:border-r border-zinc-800 w-full md:w-24 md:h-full z-10 overflow-x-auto md:overflow-x-visible">
      <div className="hidden md:block mb-8 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] text-center w-full pl-[0.2em]">
        Petakelas Tools
      </div>
      
      {tools.map((tool) => {
        const isActive = currentTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => setTool(tool.id)}
            className={`
              flex flex-col items-center justify-center min-w-[64px] md:w-full py-2 md:py-3 rounded-xl transition-all duration-200
              ${isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}
            `}
          >
            <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'hover:scale-105'}`}>
              {tool.icon}
            </div>
            
            <span className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider text-center`}>
                {tool.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};