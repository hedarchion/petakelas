
import React, { useState, useRef, useEffect, memo } from 'react';
import { ToolType, CellData } from '../types';
import { User, MonitorPlay } from 'lucide-react';

interface GridCellProps {
  data: CellData;
  onClick: () => void;
  onNameChange: (newName: string) => void;
  onNameBlur?: () => void;
  selectedTool: ToolType;
  totalRows: number;
  totalCols: number;
  style?: React.CSSProperties;
  isMergeAnchor?: boolean;
  isExporting?: boolean;
}

const GridCellComponent: React.FC<GridCellProps> = ({ 
  data, 
  onClick, 
  onNameChange, 
  onNameBlur,
  selectedTool,
  totalRows,
  totalCols,
  style,
  isMergeAnchor,
  isExporting
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.type === 'student' && selectedTool === 'student') {
      if (!isEditing) setIsEditing(true);
      return;
    }
    onClick();
    setIsEditing(false);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onNameBlur) onNameBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      // Blur is triggered automatically when isEditing becomes false due to React state change?
      // Actually manually calling handleBlur here is safer if needed, but the textarea onBlur handles it.
    }
  };

  const baseClasses = `relative w-full h-full transition-all duration-200 cursor-pointer rounded-[2px] overflow-hidden ${isMergeAnchor ? 'ring-4 ring-purple-500 ring-inset z-20' : ''}`;

  const getCellStyles = () => {
    switch (data.type) {
      case 'student':
        return `${baseClasses} bg-white border-2 border-zinc-900 hover:border-emerald-600 shadow-sm`;
      case 'teacher':
        return `${baseClasses} bg-blue-50 border-2 border-blue-900`;
      case 'corridor-vertical':
      case 'corridor-horizontal':
        return `${baseClasses}`;
      default:
        // When exporting, remove the dashed border from empty cells to make them invisible
        return `${baseClasses} bg-transparent ${isExporting ? 'border-none' : 'border border-dashed border-zinc-300 hover:border-zinc-400'}`;
    }
  };

  const renderContent = () => {
    if (data.type === 'student') {
      const nameLength = data.name?.length || 0;
      const isMerged = (data.rowSpan || 1) > 1 || (data.colSpan || 1) > 1;
      
      let textSizeClass = isMerged ? 'text-base md:text-xl' : 'text-xs md:text-sm';
      if (nameLength > 12) textSizeClass = isMerged ? 'text-sm md:text-lg' : 'text-[11px]';
      if (nameLength > 20) textSizeClass = isMerged ? 'text-xs md:text-base' : 'text-[10px]';

      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 relative group">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-zinc-900/10 group-hover:bg-emerald-500/20 transition-colors" />
          <div className="absolute top-2 right-2 text-zinc-200/50 pointer-events-none">
             <User size={isMerged ? 16 : 12} strokeWidth={3} />
          </div>
          
          {isEditing ? (
            <textarea
              ref={inputRef}
              className={`w-full h-full bg-transparent text-center resize-none outline-none ${isMerged ? 'text-lg' : 'text-xs'} text-zinc-900 placeholder-zinc-400 leading-tight py-2 font-bold z-10`}
              value={data.name || ''}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Name"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center px-1 z-10">
               <span 
                 className={`${textSizeClass} text-center font-bold text-zinc-900 break-words w-full line-clamp-4`}
                 style={{ hyphens: 'auto', wordBreak: 'break-word' }}
               >
                 {data.name || (!isExporting && <span className="text-zinc-300 italic font-normal">Student</span>)}
               </span>
            </div>
          )}
        </div>
      );
    }

    if (data.type === 'teacher') {
      const isMerged = (data.rowSpan || 1) > 1 || (data.colSpan || 1) > 1;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center relative group p-2">
            <MonitorPlay className={`${isMerged ? 'w-8 h-8' : 'w-5 h-5'} text-blue-900 mb-1`} />
            <span className={`${isMerged ? 'text-xs' : 'text-[9px]'} font-black text-blue-900 uppercase tracking-widest`}>Teacher</span>
        </div>
      );
    }

    if (data.type === 'corridor-vertical') {
        return (
            <div className="w-full h-full bg-zinc-100/50 relative shadow-inner border-x border-zinc-300/30">
                 <svg width="100%" height="100%" className="absolute inset-0 opacity-40">
                    <defs>
                        <pattern id={`floor-v-${data.id}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                            <path d="M0 4L4 0" stroke="currentColor" strokeWidth="0.5" className="text-zinc-500"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#floor-v-${data.id})`} />
                 </svg>
            </div>
        );
    }

    if (data.type === 'corridor-horizontal') {
        return (
            <div className="w-full h-full bg-zinc-100/50 relative shadow-inner border-y border-zinc-300/30">
                 <svg width="100%" height="100%" className="absolute inset-0 opacity-40">
                    <defs>
                        <pattern id={`floor-h-${data.id}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                            <path d="M0 4L4 0" stroke="currentColor" strokeWidth="0.5" className="text-zinc-500"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#floor-h-${data.id})`} />
                 </svg>
            </div>
        );
    }

    return null;
  };

  return (
    <div 
      onClick={handleClick}
      className={getCellStyles()}
      style={{ ...style, contain: 'layout style' }}
    >
       {renderContent()}
    </div>
  );
};

export const GridCell = memo(GridCellComponent);
