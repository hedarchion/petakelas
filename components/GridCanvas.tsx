
import React, { useRef, useMemo } from 'react';
import { CellData, GridConfig, ToolType, ClassInfo } from '../types';
import { GridCell } from './GridCell';
import { Plus } from 'lucide-react';

interface GridCanvasProps {
  id: string; // DOM ID for export
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

  const getCell = (row: number, col: number) => cells.find(c => c.row === row && c.col === col);

  const { colTemplate, rowTemplate } = useMemo(() => {
    if (!gridConfig.autoResize) {
        return {
            colTemplate: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
            rowTemplate: `repeat(${gridConfig.rows}, minmax(0, 1fr))`
        };
    }

    let cols = '';
    for (let c = 0; c < gridConfig.cols; c++) {
        const colCells = cells.filter(cell => cell.col === c);
        const hasBlocker = colCells.some(cell => cell.type === 'student' || cell.type === 'teacher');
        const hasTrigger = colCells.some(cell => cell.type === 'corridor-vertical');
        cols += (hasTrigger && !hasBlocker) ? '0.35fr ' : '1fr ';
    }

    let rows = '';
    for (let r = 0; r < gridConfig.rows; r++) {
        const rowCells = cells.filter(cell => cell.row === r);
        const hasBlocker = rowCells.some(cell => cell.type === 'student' || cell.type === 'teacher');
        const hasTrigger = rowCells.some(cell => cell.type === 'corridor-horizontal');
        rows += (hasTrigger && !hasBlocker) ? '0.35fr ' : '1fr ';
    }

    return { colTemplate: cols.trim(), rowTemplate: rows.trim() };
  }, [gridConfig.cols, gridConfig.rows, gridConfig.autoResize, cells]);

  const Board = ({ vertical = false }: { vertical?: boolean }) => (
    <div className={`
        flex items-center justify-center bg-white border-2 border-zinc-900 shadow-sm z-10
        ${vertical ? 'h-full w-10 py-4' : 'w-full h-10 px-4'}
    `}>
        <span className={`text-[10px] font-black uppercase tracking-widest text-zinc-400 ${vertical ? 'rotate-180' : ''}`} style={{ writingMode: vertical ? 'vertical-rl' : 'horizontal-tb' }}>
            Whiteboard
        </span>
    </div>
  );

  const AddTrigger = ({ 
    direction, 
    onClick 
  }: { 
    direction: 'top' | 'bottom' | 'left' | 'right', 
    onClick: () => void 
  }) => {
    if (viewMode) return null;
    
    let posClass = '';
    let lineClass = '';
    
    if (direction === 'top') {
        posClass = '-top-6 left-0 right-0 h-6 flex-col justify-center';
        lineClass = 'left-0 right-0 h-px bottom-0 border-t-2 border-dashed border-emerald-500/40';
    }
    if (direction === 'bottom') {
        posClass = '-bottom-6 left-0 right-0 h-6 flex-col justify-center';
        lineClass = 'left-0 right-0 h-px top-0 border-t-2 border-dashed border-emerald-500/40';
    }
    if (direction === 'left') {
        posClass = '-left-6 top-0 bottom-0 w-6 flex-row justify-center';
        lineClass = 'top-0 bottom-0 w-px right-0 border-l-2 border-dashed border-emerald-500/40';
    }
    if (direction === 'right') {
        posClass = '-right-6 top-0 bottom-0 w-6 flex-row justify-center';
        lineClass = 'top-0 bottom-0 w-px left-0 border-l-2 border-dashed border-emerald-500/40';
    }

    return (
        <div 
            data-html2canvas-ignore="true"
            className={`absolute z-30 flex items-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer group/trigger ${posClass}`}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            <div className={`absolute pointer-events-none ${lineClass}`} />
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
  };

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

  return (
    <div className="w-full flex justify-center">
      <div 
        id={id}
        ref={containerRef}
        className="relative bg-white shadow-2xl shadow-black/50 ring-1 ring-zinc-200 transition-all duration-300 flex flex-col will-change-transform"
        style={{ 
          aspectRatio: '210/297', 
          width: '100%', 
          maxWidth: '840px', 
          minWidth: '400px', 
        }}
      >
        {/* Optimized Grain Layer */}
        <div className="absolute inset-0 pointer-events-none mix-blend-multiply z-0 opacity-[0.03]" 
             style={{ 
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` 
             }}>
        </div>

        <div className="flex-1 flex flex-col p-8 md:p-12 z-10 w-full h-full relative">
            <div className="mb-6 pb-4 border-b-2 border-zinc-900 flex flex-col items-center text-center flex-shrink-0">
                <h1 className="text-3xl md:text-5xl font-extrabold text-zinc-900 uppercase tracking-tight break-words max-w-full">
                    {classInfo.name || "Untitled Class"}
                </h1>
                {classInfo.subtitle && (
                    <p className="text-xl md:text-2xl text-zinc-600 mt-2 font-medium font-serif italic tracking-wide">
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
                        <AddTrigger direction="top" onClick={() => onAddRow('top')} />
                        <AddTrigger direction="bottom" onClick={() => onAddRow('bottom')} />
                        <AddTrigger direction="left" onClick={() => onAddCol('left')} />
                        <AddTrigger direction="right" onClick={() => onAddCol('right')} />

                        <div 
                            className="w-full h-full grid gap-2 md:gap-3 content-center"
                            style={{
                                gridTemplateColumns: colTemplate,
                                gridTemplateRows: rowTemplate
                            }}
                        >
                            {Array.from({ length: gridConfig.rows * gridConfig.cols }).map((_, index) => {
                                const row = Math.floor(index / gridConfig.cols);
                                const col = index % gridConfig.cols;
                                
                                if (coveredCoordinates.has(`${row}-${col}`)) return null;

                                const cellData = getCell(row, col) || { id: `${row}-${col}`, row, col, type: 'eraser' };

                                return (
                                    <GridCell 
                                        key={`${row}-${col}`}
                                        data={cellData}
                                        selectedTool={selectedTool}
                                        onClick={() => onCellClick(row, col)}
                                        onNameChange={(name) => onCellNameChange(row, col, name)}
                                        onNameBlur={onCellNameBlur}
                                        totalRows={gridConfig.rows}
                                        totalCols={gridConfig.cols}
                                        style={{
                                          gridRow: `span ${cellData.rowSpan || 1}`,
                                          gridColumn: `span ${cellData.colSpan || 1}`
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
