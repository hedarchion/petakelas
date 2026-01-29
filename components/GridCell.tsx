
import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { ToolType, CellData } from '../types';
import { User, MonitorPlay } from 'lucide-react';

interface GridCellProps {
  row: number;
  col: number;
  data: CellData;
  onClick: (row: number, col: number) => void;
  onNameChange: (row: number, col: number, newName: string) => void;
  onNameBlur?: () => void;
  selectedTool: ToolType;
  totalRows: number;
  totalCols: number;
  style?: React.CSSProperties;
  isMergeAnchor?: boolean;
  isExporting?: boolean;
}

const GridCellComponent: React.FC<GridCellProps> = ({ 
  row,
  col,
  data, 
  onClick, 
  onNameChange, 
  onNameBlur,
  selectedTool,
  isMergeAnchor,
  isExporting,
  style
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.type === 'student' && selectedTool === 'student') {
      if (!isEditing) setIsEditing(true);
      return;
    }
    onClick(row, col);
    setIsEditing(false);
  }, [data.type, selectedTool, isEditing, onClick, row, col]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (onNameBlur) onNameBlur();
  }, [onNameBlur]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNameChange(row, col, e.target.value);
  }, [onNameChange, row, col]);

  const isMerged = (data.rowSpan || 1) > 1 || (data.colSpan || 1) > 1;
  const nameLength = data.name?.length || 0;

  // Calculate text size
  let textSizeClass = isMerged ? 'text-sm sm:text-base md:text-xl' : 'text-[10px] sm:text-xs md:text-sm';
  if (nameLength > 12) textSizeClass = isMerged ? 'text-xs sm:text-sm md:text-lg' : 'text-[9px] sm:text-[11px]';
  if (nameLength > 20) textSizeClass = isMerged ? 'text-[10px] sm:text-xs md:text-base' : 'text-[8px] sm:text-[10px]';

  // Cell styles based on type
  const baseClasses = `relative w-full h-full transition-all duration-200 cursor-pointer rounded-[2px] overflow-hidden ${isMergeAnchor ? 'ring-4 ring-purple-500 ring-inset z-20' : ''}`;
  
  let cellClasses = baseClasses;
  switch (data.type) {
    case 'student':
      cellClasses += ' bg-white border-2 border-zinc-900 hover:border-emerald-600 shadow-sm';
      break;
    case 'teacher':
      cellClasses += ' bg-blue-50 border-2 border-blue-900';
      break;
    case 'corridor-vertical':
    case 'corridor-horizontal':
      break;
    default:
      cellClasses += ` bg-transparent ${isExporting ? 'border-none' : 'border border-dashed border-zinc-300 hover:border-zinc-400'}`;
  }

  // Render content based on type
  const renderContent = () => {
    switch (data.type) {
      case 'student':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 relative group">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-zinc-900/10 group-hover:bg-emerald-500/20 transition-colors" />
            <div className="absolute top-2 right-2 text-zinc-200/50 pointer-events-none">
              <User size={isMerged ? 16 : 12} strokeWidth={3} />
            </div>
            
            {isEditing ? (
              <textarea
                ref={inputRef}
                className={`w-full h-full bg-transparent text-center resize-none outline-none ${isMerged ? 'text-base sm:text-lg' : 'text-xs'} text-zinc-900 placeholder-zinc-400 leading-tight py-2 font-bold z-10`}
                value={data.name || ''}
                onChange={handleNameChange}
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

      case 'teacher':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative group p-1 sm:p-2">
            <MonitorPlay className={`${isMerged ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-4 h-4 sm:w-5 sm:h-5'} text-blue-900 mb-0.5 sm:mb-1`} />
            <span className={`${isMerged ? 'text-[10px] sm:text-xs' : 'text-[8px] sm:text-[9px]'} font-black text-blue-900 uppercase tracking-widest`}>
              Teacher
            </span>
          </div>
        );

      case 'corridor-vertical':
      case 'corridor-horizontal':
        return (
          <div 
            className="w-full h-full bg-zinc-100/50 relative shadow-inner border-x border-zinc-300/30"
            style={{
              backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(113, 113, 122, 0.15) 3px, rgba(113, 113, 122, 0.15) 4px)`,
              backgroundSize: '6px 6px'
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cellClasses}
      style={style}
    >
      {renderContent()}
    </div>
  );
};

// Simple memo - only re-render if data actually changes
export const GridCell = memo(GridCellComponent, (prevProps, nextProps) => {
  // Always re-render if these change
  if (prevProps.isMergeAnchor !== nextProps.isMergeAnchor) return false;
  if (prevProps.isExporting !== nextProps.isExporting) return false;
  if (prevProps.selectedTool !== nextProps.selectedTool) return false;
  
  // Check cell data
  if (prevProps.data.type !== nextProps.data.type) return false;
  if (prevProps.data.name !== nextProps.data.name) return false;
  if (prevProps.data.rowSpan !== nextProps.data.rowSpan) return false;
  if (prevProps.data.colSpan !== nextProps.data.colSpan) return false;
  
  return true;
});
