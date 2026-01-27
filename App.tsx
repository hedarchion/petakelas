
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { GridCanvas } from './components/GridCanvas';
import { ToolType, GridConfig, CellData, ClassInfo } from './types';
import { Eye, EyeOff, Settings2 } from 'lucide-react';

declare const html2canvas: any;

interface HistoryState {
  cells: CellData[];
  gridConfig: GridConfig;
  classInfo: ClassInfo;
}

function App() {
  const [gridConfig, setGridConfig] = useState<GridConfig>({ 
    rows: 5, 
    cols: 6,
    boardPosition: 'top',
    autoResize: true
  });
  const [cells, setCells] = useState<CellData[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('student');
  const [classInfo, setClassInfo] = useState<ClassInfo>({ name: '', subtitle: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [mergeAnchor, setMergeAnchor] = useState<{ row: number; col: number } | null>(null);
  
  // Key to force remount of grid on reset
  const [remountKey, setRemountKey] = useState(0);

  // Undo/Redo Logic
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryUpdate = useRef(false);
  const isResetting = useRef(false);

  // Initial history save
  useEffect(() => {
    if (history.length === 0) {
        const initialState: HistoryState = {
            cells: [],
            gridConfig: { rows: 5, cols: 6, boardPosition: 'top', autoResize: true },
            classInfo: { name: '', subtitle: '' }
        };
        setHistory([initialState]);
        setHistoryIndex(0);
    }
  }, []);

  const pushToHistory = useCallback((newState: HistoryState) => {
    if (isHistoryUpdate.current || isResetting.current) return;
    setHistory(prev => {
        const currentIdx = historyIndex;
        const newHistory = prev.slice(0, currentIdx + 1);
        const nextHistory = [...newHistory, JSON.parse(JSON.stringify(newState))];
        return nextHistory.slice(-50); // Keep last 50 steps
    });
    setHistoryIndex(prev => {
        const nextIdx = prev + 1;
        return nextIdx >= 50 ? 49 : nextIdx;
    });
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
        isHistoryUpdate.current = true;
        const prevIndex = historyIndex - 1;
        const prevState = history[prevIndex];
        
        setCells(prevState.cells);
        setGridConfig(prevState.gridConfig);
        setClassInfo(prevState.classInfo);
        setHistoryIndex(prevIndex);
        
        // Use timeout to ensure state has applied before allowing new history pushes
        setTimeout(() => { isHistoryUpdate.current = false; }, 50);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
        isHistoryUpdate.current = true;
        const nextIndex = historyIndex + 1;
        const nextState = history[nextIndex];
        
        setCells(nextState.cells);
        setGridConfig(nextState.gridConfig);
        setClassInfo(nextState.classInfo);
        setHistoryIndex(nextIndex);
        
        setTimeout(() => { isHistoryUpdate.current = false; }, 50);
    }
  }, [historyIndex, history]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (viewMode) return;

    if (selectedTool === 'merge') {
        if (!mergeAnchor) {
            setMergeAnchor({ row, col });
        } else {
            const startRow = Math.min(mergeAnchor.row, row);
            const endRow = Math.max(mergeAnchor.row, row);
            const startCol = Math.min(mergeAnchor.col, col);
            const endCol = Math.max(mergeAnchor.col, col);

            const rowSpan = endRow - startRow + 1;
            const colSpan = endCol - startCol + 1;

            setCells(prev => {
                const filtered = prev.filter(c => 
                    !(c.row >= startRow && c.row <= endRow && c.col >= startCol && c.col <= endCol)
                );
                const mergedBlock: CellData = {
                    id: `${startRow}-${startCol}`,
                    row: startRow,
                    col: startCol,
                    type: 'student',
                    rowSpan,
                    colSpan,
                    name: ''
                };
                const newCells = [...filtered, mergedBlock];
                pushToHistory({ cells: newCells, gridConfig, classInfo });
                return newCells;
            });
            setMergeAnchor(null);
        }
        return;
    }

    setCells(prev => {
      const existingIndex = prev.findIndex(c => c.row === row && c.col === col);
      let nextCells: CellData[];
      
      if (selectedTool === 'eraser') {
        if (existingIndex > -1) {
            nextCells = [...prev];
            nextCells.splice(existingIndex, 1);
            pushToHistory({ cells: nextCells, gridConfig, classInfo });
            return nextCells;
        }
        return prev;
      }

      if (selectedTool === 'student' && existingIndex > -1 && prev[existingIndex].type === 'student') {
        return prev; 
      }

      const newCell: CellData = {
        id: `${row}-${col}`,
        row,
        col,
        type: selectedTool,
        name: selectedTool === 'student' ? '' : undefined,
        rowSpan: existingIndex > -1 ? prev[existingIndex].rowSpan : undefined,
        colSpan: existingIndex > -1 ? prev[existingIndex].colSpan : undefined,
      };

      if (existingIndex > -1) {
        nextCells = [...prev];
        nextCells[existingIndex] = newCell;
      } else {
        nextCells = [...prev, newCell];
      }
      
      pushToHistory({ cells: nextCells, gridConfig, classInfo });
      return nextCells;
    });
  }, [selectedTool, viewMode, mergeAnchor, gridConfig, classInfo, pushToHistory]);

  const handleCellNameChange = useCallback((row: number, col: number, name: string) => {
    if (viewMode) return;
    setCells(prev => {
        const existingIndex = prev.findIndex(c => c.row === row && c.col === col);
        if (existingIndex > -1) {
            const newCells = [...prev];
            newCells[existingIndex] = { ...newCells[existingIndex], name };
            return newCells;
        }
        return prev;
    });
  }, [viewMode]);

  // Push to history when name editing is finished (on blur)
  const handleCellNameBlur = useCallback(() => {
    pushToHistory({ cells, gridConfig, classInfo });
  }, [cells, gridConfig, classInfo, pushToHistory]);

  const handleAddRow = useCallback((position: 'top' | 'bottom') => {
    if (gridConfig.rows >= 20) return;
    setCells(prevCells => {
        let nextCells = prevCells;
        if (position === 'top') {
            nextCells = prevCells.map(c => ({ ...c, row: c.row + 1 }));
        }
        setGridConfig(prevGrid => {
            const nextGrid = { ...prevGrid, rows: prevGrid.rows + 1 };
            pushToHistory({ cells: nextCells, gridConfig: nextGrid, classInfo });
            return nextGrid;
        });
        return nextCells;
    });
  }, [gridConfig.rows, classInfo, pushToHistory]);

  const handleAddCol = useCallback((position: 'left' | 'right') => {
    if (gridConfig.cols >= 20) return;
    setCells(prevCells => {
        let nextCells = prevCells;
        if (position === 'left') {
            nextCells = prevCells.map(c => ({ ...c, col: c.col + 1 }));
        }
        setGridConfig(prevGrid => {
            const nextGrid = { ...prevGrid, cols: prevGrid.cols + 1 };
            pushToHistory({ cells: nextCells, gridConfig: nextGrid, classInfo });
            return nextGrid;
        });
        return nextCells;
    });
  }, [gridConfig.cols, classInfo, pushToHistory]);

  const handleReset = useCallback(() => {
    isResetting.current = true;
    
    const resetConfig: GridConfig = {
      rows: 5,
      cols: 6,
      boardPosition: 'top',
      autoResize: true
    };
    const resetInfo = { name: '', subtitle: '' };
    
    // Batch set updates
    setCells([]);
    setClassInfo(resetInfo);
    setGridConfig(resetConfig);
    setSelectedTool('student');
    setMergeAnchor(null);
    setViewMode(false);
    setShowMobileSettings(false);
    setRemountKey(prev => prev + 1); // Force grid remount
    
    // Reset history
    const initialState: HistoryState = {
      cells: [],
      gridConfig: resetConfig,
      classInfo: resetInfo
    };
    setHistory([initialState]);
    setHistoryIndex(0);
    
    setTimeout(() => {
      isResetting.current = false;
    }, 100);
  }, []);

  const handleExport = async () => {
    const element = document.getElementById('petakelas-canvas');
    if (!element) return;
    
    setIsExporting(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const canvas = await html2canvas(element, {
            scale: 3,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            allowTaint: true
        });
        const link = document.createElement('a');
        link.download = `${classInfo.name.replace(/\s+/g, '-').toLowerCase() || 'petakelas-plan'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error("Export failed", error);
        alert("Failed to export image. Please try again.");
    } finally {
        setIsExporting(false);
        setShowMobileSettings(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Mobile & Tablet Top Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 z-50 flex-shrink-0 shadow-lg">
          <div className="flex items-center gap-2 overflow-hidden">
             <div className="w-8 h-8 rounded-lg bg-emerald-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">P</div>
             <span className="font-bold text-base truncate">{classInfo.name || "Petakelas"}</span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
             <button 
                onClick={() => setViewMode(!viewMode)}
                className={`p-2 rounded-lg transition-colors ${viewMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}
                title="Toggle View Mode"
             >
                {viewMode ? <EyeOff size={20} /> : <Eye size={20} />}
             </button>
             <button 
                onClick={() => setShowMobileSettings(true)}
                className="p-2 bg-zinc-800 rounded-lg text-zinc-400"
                title="Settings"
             >
                <Settings2 size={20} />
             </button>
          </div>
      </div>

      {/* Main Tools Toolbar - Vertical on Tablet/Desktop, Horizontal Bottom on Mobile */}
      <div className={`
         fixed bottom-0 left-0 right-0 z-40 md:relative md:z-30 md:block md:w-auto
         transition-transform duration-300 ease-in-out
         ${viewMode ? 'translate-y-full md:translate-y-0 md:-translate-x-full md:hidden' : 'translate-y-0'}
         ${showMobileSettings ? 'hidden md:block' : ''}
      `}>
         <Toolbar currentTool={selectedTool} setTool={(t) => { setSelectedTool(t); setMergeAnchor(null); }} />
      </div>

      {/* Grid View Area */}
      <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden bg-zinc-900/50">
         <div className="absolute inset-0 opacity-[0.05]" 
              style={{ 
                  backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
                  backgroundSize: '24px 24px' 
              }}>
         </div>

         <div className={`flex-1 overflow-auto relative scroll-smooth w-full h-full ${viewMode ? 'pb-0' : 'pb-24 md:pb-0'}`}>
            <div className="min-h-full w-full flex items-center justify-center p-4 md:p-8 lg:p-12">
                <GridCanvas 
                    key={remountKey} // Forces remount on reset
                    id="petakelas-canvas"
                    gridConfig={gridConfig}
                    cells={cells}
                    onCellClick={handleCellClick}
                    onCellNameChange={handleCellNameChange}
                    onCellNameBlur={handleCellNameBlur}
                    onAddRow={handleAddRow}
                    onAddCol={handleAddCol}
                    selectedTool={selectedTool}
                    classInfo={classInfo}
                    viewMode={viewMode}
                    mergeAnchor={mergeAnchor}
                    isExporting={isExporting}
                />
            </div>
         </div>

         {viewMode && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:hidden z-50 animate-in fade-in slide-in-from-bottom-4">
                 <button 
                    onClick={() => setViewMode(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-full shadow-2xl text-emerald-400 font-medium whitespace-nowrap"
                 >
                    <EyeOff size={16} /> Exit View Mode
                 </button>
             </div>
         )}
      </div>

      {/* Mobile & Tablet Settings Overlay Background */}
      <div className={`
          fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden
          ${showMobileSettings ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `} onClick={() => setShowMobileSettings(false)} />

      {/* Sidebar Panel - Collapsible drawer on Mobile/Tablet, Fixed side panel on Desktop */}
      <div className={`
          fixed inset-y-0 right-0 z-50 w-80 bg-zinc-950 shadow-2xl transform transition-transform duration-300 ease-out 
          lg:relative lg:transform-none lg:z-20 lg:shadow-2xl lg:shadow-black
          ${showMobileSettings ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          ${viewMode ? 'lg:hidden' : ''} 
      `}>
        <Sidebar 
            classInfo={classInfo}
            setClassInfo={setClassInfo}
            gridConfig={gridConfig}
            setGridConfig={setGridConfig}
            onExport={handleExport}
            isExporting={isExporting}
            onReset={handleReset}
            onClose={() => setShowMobileSettings(false)}
            cells={cells}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
        />
      </div>
    </div>
  );
}

export default App;
