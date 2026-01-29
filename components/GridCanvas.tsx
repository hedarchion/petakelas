
import React, { useRef, useMemo, memo, useCallback } from 'react';
import { CellData, GridConfig, ToolType, ClassInfo } from '../types';
import { GridCell } from './GridCell';
import { Plus } from 'lucide-react';

interface GridCanvasProps {
  id: string;
  gridConfig: GridConfig;
  cells: CellData[];
  onCellClick: (row: number, col: number) => void;
  onCellNameChange: (row: number, col: number, name: string) => void;
  onCellNameBlur: () => void;
  onAddRow: (position: 'top' | 'bottom') => void;
  onAddCol: (position: 'left' | 'right') => void;
  selectedTool: ToolType;
  classInfo: ClassInfo;
  viewMode: boolean;
  mergeAnchor: { row: number; col: number } | null;
  isExporting: boolean;
}

// Memoized Board component to prevent re-renders
const Board = memo(({ vertical = false }: { vertical?: boolean }) => (
  <div className={`
      flex items-center justify-center bg-white border-2 border-zinc-900 shadow-sm z-10
      ${vertical ? 'h-full w-10 py-4' : 'w-full h-10 px-4'}
  `}>
    <span 
      className={`text-[10px] font-black uppercase tracking-widest text-zinc-400 ${vertical ? 'rotate-180' : ''}`} 
      style={{ writingMode: vertical ? 'vertical-rl' : 'horizontal-tb' }}
    >
      Whiteboard
    </span>
  </div>
));
Board.displayName = 'Board';

// Memoized AddTrigger component
interface AddTriggerProps {
  direction: 'top' | 'bottom' | 'left' | 'right';
  onClick: () => void;
  viewMode: boolean;
}

const AddTrigger = memo(({ direction, onClick, viewMode }: AddTriggerProps) => {
  if (viewMode) return null;
  
  const posClasses = {
    top: '-top-6 left-0 right-0 h-6 flex-col justify-center',
    bottom: '-bottom-6 left-0 right-0 h-6 flex-col justify-center',
    left: '-left-6 top-0 bottom-0 w-6 flex-row justify-center',
    right: '-right-6 top-0 bottom-0 w-6 flex-row justify-center',
  };
  
  const lineClasses = {
    top: 'left-0 right-0 h-px bottom-0 border-t-2 border-dashed border-emerald-500/40',
    bottom: 'left-0 right-0 h-px top-0 border-t-2 border-dashed border-emerald-500/40',
    left: 'top-0 bottom-0 w-px right-0 border-l-2 border-dashed border-emerald-500/40',
    right: 'top-0 bottom-0 w-px left-0 border-l-2 border-dashed border-emerald-500/40',
  };

  return (
    <div 
      data-html2canvas-ignore="true"
      className={`absolute z-30 flex items-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer group/trigger ${posClasses[direction]}`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <div className={`absolute pointer-events-none ${lineClasses[direction]}`} />
      <div className={`
        bg-emerald-600 text-white rounded-full p-1 shadow-md 
        transform transition-all duration-200 
        scale-75 group-hover/trigger:scale-100 group-active/trigger:scale-90
        ring-2 ring-white z-40 relative
      `}>
        <Plus size={12} strokeWidth={3} />
      </div>
    </div>
  );
});
AddTrigger.displayName = 'AddTrigger';

export const GridCanvas: React.FC<GridCanvasProps> = ({ 
  id, 
  gridConfig, 
  cells, 
  onCellClick, 
  onCellNameChange,
  onCellNameBlur,
  onAddRow,
  onAddCol,
  selectedTool,
  classInfo,
  viewMode,
  mergeAnchor,
  isExporting
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Use Map for O(1) cell lookup instead of O(n) array.find
  const cellMap = useMemo(() => {
    const map = new Map<string, CellData>();
    cells.forEach(cell => {
      map.set(`${cell.row}-${cell.col}`, cell);
    });
    return map;
  }, [cells]);

  const getCell = useCallback((row: number, col: number) => {
    return cellMap.get(`${row}-${col}`);
  }, [cellMap]);

  // Memoize grid templates - only recalculate when necessary
  const { colTemplate, rowTemplate } = useMemo(() => {
    if (!gridConfig.autoResize) {
      return {
        colTemplate: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
        rowTemplate: `repeat(${gridConfig.rows}, minmax(0, 1fr))`
      };
    }

    // Pre-calculate cell types per row/col for efficiency
    const colHasBlocker = new Array(gridConfig.cols).fill(false);
    const colHasTrigger = new Array(gridConfig.cols).fill(false);
    const rowHasBlocker = new Array(gridConfig.rows).fill(false);
    const rowHasTrigger = new Array(gridConfig.rows).fill(false);

    cells.forEach(cell => {
      if (cell.type === 'student' || cell.type === 'teacher') {
        colHasBlocker[cell.col] = true;
        rowHasBlocker[cell.row] = true;
      }
      if (cell.type === 'corridor-vertical') {
        colHasTrigger[cell.col] = true;
      }
      if (cell.type === 'corridor-horizontal') {
        rowHasTrigger[cell.row] = true;
      }
    });

    let cols = '';
    for (let c = 0; c < gridConfig.cols; c++) {
      cols += (colHasTrigger[c] && !colHasBlocker[c]) ? '0.35fr ' : '1fr ';
    }

    let rows = '';
    for (let r = 0; r < gridConfig.rows; r++) {
      rows += (rowHasTrigger[r] && !rowHasBlocker[r]) ? '0.35fr ' : '1fr ';
    }

    return { colTemplate: cols.trim(), rowTemplate: rows.trim() };
  }, [gridConfig.cols, gridConfig.rows, gridConfig.autoResize, cells]);

  // Memoize covered coordinates calculation
  const coveredCoordinates = useMemo(() => {
    const covered = new Set<string>();
    cells.forEach(cell => {
      const rs = cell.rowSpan || 1;
      const cs = cell.colSpan || 1;
      if (rs > 1 || cs > 1) {
        for (let r = cell.row; r < cell.row + rs; r++) {
          for (let c = cell.col; c < cell.col + cs; c++) {
            if (r === cell.row && c === cell.col) continue;
            covered.add(`${r}-${c}`);
          }
        }
      }
    });
    return covered;
  }, [cells]);

  // Pre-compute grid cells data to avoid recalculation during render
  const gridCells = useMemo(() => {
    const totalCells = gridConfig.rows * gridConfig.cols;
    const result: Array<{ row: number; col: number; cellData: CellData | undefined; isCovered: boolean }> = [];
    
    for (let index = 0; index < totalCells; index++) {
      const row = Math.floor(index / gridConfig.cols);
      const col = index % gridConfig.cols;
      const key = `${row}-${col}`;
      
      if (coveredCoordinates.has(key)) continue;
      
      const cellData = cellMap.get(key);
      result.push({
        row,
        col,
        cellData,
        isCovered: false
      });
    }
    return result;
  }, [gridConfig.rows, gridConfig.cols, cellMap, coveredCoordinates]);

  // Memoized callbacks to prevent GridCell re-renders
  const handleCellClick = useCallback((row: number, col: number) => {
    onCellClick(row, col);
  }, [onCellClick]);

  const handleNameChange = useCallback((row: number, col: number, name: string) => {
    onCellNameChange(row, col, name);
  }, [onCellNameChange]);

  const handleAddRowTop = useCallback(() => onAddRow('top'), [onAddRow]);
  const handleAddRowBottom = useCallback(() => onAddRow('bottom'), [onAddRow]);
  const handleAddColLeft = useCallback(() => onAddCol('left'), [onAddCol]);
  const handleAddColRight = useCallback(() => onAddCol('right'), [onAddCol]);

  return (
    <div className="w-full flex justify-center">
      <div 
        id={id}
        ref={containerRef}
        className="relative bg-white shadow-2xl shadow-black/50 ring-1 ring-zinc-200 transition-all duration-300 flex flex-col will-change-transform mx-auto"
        style={{ 
          aspectRatio: '210/297', 
          width: '100%', 
          maxWidth: '840px', 
          minWidth: '280px', 
        }}
      >
        {/* Optimized Grain Layer */}
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-multiply z-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` 
          }}
        />

        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 lg:p-12 z-10 w-full h-full relative">
          <div className="mb-3 sm:mb-4 md:mb-6 pb-2 sm:pb-4 border-b-2 border-zinc-900 flex flex-col items-center text-center flex-shrink-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-extrabold text-zinc-900 uppercase tracking-tight break-words max-w-full">
              {classInfo.name || "Untitled Class"}
            </h1>
            {classInfo.subtitle && (
              <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-zinc-600 mt-1 sm:mt-2 font-medium font-serif italic tracking-wide">
                {classInfo.subtitle}
              </p>
            )}
          </div>

          <div className="flex-1 flex flex-col relative min-h-0">
            {gridConfig.boardPosition === 'top' && (
              <div className="mb-4 flex-shrink-0"><Board /></div>
            )}

            <div className="flex-1 flex min-h-0">
              {gridConfig.boardPosition === 'left' && (
                <div className="mr-4 flex-shrink-0"><Board vertical /></div>
              )}

              <div className="relative flex-1 w-full h-full">
                <AddTrigger direction="top" onClick={handleAddRowTop} viewMode={viewMode} />
                <AddTrigger direction="bottom" onClick={handleAddRowBottom} viewMode={viewMode} />
                <AddTrigger direction="left" onClick={handleAddColLeft} viewMode={viewMode} />
                <AddTrigger direction="right" onClick={handleAddColRight} viewMode={viewMode} />

                <div 
                  className="w-full h-full grid gap-1 sm:gap-2 md:gap-3 content-center"
                  style={{
                    gridTemplateColumns: colTemplate,
                    gridTemplateRows: rowTemplate,
                    contain: 'layout paint'
                  }}
                >
                  {gridCells.map(({ row, col, cellData }) => {
                    const finalCellData = cellData || { id: `${row}-${col}`, row, col, type: 'eraser' as const };
                    
                    return (
                      <GridCell 
                        key={`${row}-${col}`}
                        row={row}
                        col={col}
                        data={finalCellData}
                        selectedTool={selectedTool}
                        onClick={handleCellClick}
                        onNameChange={handleNameChange}
                        onNameBlur={onCellNameBlur}
                        totalRows={gridConfig.rows}
                        totalCols={gridConfig.cols}
                        style={{
                          gridRow: `span ${finalCellData.rowSpan || 1}`,
                          gridColumn: `span ${finalCellData.colSpan || 1}`
                        }}
                        isMergeAnchor={mergeAnchor?.row === row && mergeAnchor?.col === col}
                        isExporting={isExporting}
                      />
                    );
                  })}
                </div>
              </div>

              {gridConfig.boardPosition === 'right' && (
                <div className="ml-4 flex-shrink-0"><Board vertical /></div>
              )}
            </div>

            {gridConfig.boardPosition === 'bottom' && (
              <div className="mt-4 flex-shrink-0"><Board /></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
