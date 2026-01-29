
import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { GridCanvas } from './components/GridCanvas';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ErrorBoundary } from './components/error-boundary/ErrorBoundary';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useKeyboardShortcuts, createUndoShortcut, createRedoShortcut, createEscapeShortcut, createExportShortcut } from './hooks/useKeyboardShortcuts';
import { ToolType, GridConfig, CellData, ClassInfo } from './types';
import { Eye, EyeOff, Settings2 } from 'lucide-react';

declare const html2canvas: any;

const STORAGE_KEY = 'petakelas-data-v1';
const MAX_ROWS = 20;
const MAX_COLS = 20;
const MAX_HISTORY = 50;

interface HistoryState {
  cells: CellData[];
  gridConfig: GridConfig;
  classInfo: ClassInfo;
}

interface SavedData {
  cells: CellData[];
  gridConfig: GridConfig;
  classInfo: ClassInfo;
  timestamp: number;
}

// Memoized header component
const MobileHeader = memo(({ 
  className, 
  viewMode, 
  onToggleViewMode, 
  onOpenSettings 
}: { 
  className: string; 
  viewMode: boolean; 
  onToggleViewMode: () => void; 
  onOpenSettings: () => void;
}) => (
  <header className="lg:hidden flex items-center justify-between p-3 sm:p-4 bg-zinc-900 border-b border-zinc-800 z-50 flex-shrink-0 shadow-lg" role="banner">
    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-xs sm:text-sm" aria-hidden="true">P</div>
      <h1 className="font-bold text-sm sm:text-base truncate max-w-[120px] sm:max-w-[200px]">{className || "Petakelas"}</h1>
    </div>
    <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
      <button 
        onClick={onToggleViewMode}
        className={`p-1.5 sm:p-2 rounded-lg transition-colors ${viewMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}
        title={viewMode ? "Exit View Mode" : "Enter View Mode"}
        aria-label={viewMode ? "Exit View Mode" : "Enter View Mode"}
        aria-pressed={viewMode}
      >
        {viewMode ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
      </button>
      <button 
        onClick={onOpenSettings}
        className="p-1.5 sm:p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
        title="Open Settings"
        aria-label="Open Settings"
      >
        <Settings2 size={18} className="sm:w-5 sm:h-5" />
      </button>
    </div>
  </header>
));
MobileHeader.displayName = 'MobileHeader';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const Toasts: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  useEffect(() => {
    toasts.forEach(toast => {
      const timer = setTimeout(() => onRemove(toast.id), 3000);
      return () => clearTimeout(timer);
    });
  }, [toasts, onRemove]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium pointer-events-auto animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' :
            toast.type === 'error' ? 'bg-red-600 text-white' :
            'bg-zinc-800 text-zinc-100'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

function AppContent() {
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [remountKey, setRemountKey] = useState(0);

  // History management
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryUpdate = useRef(false);
  const isResetting = useRef(false);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

  // Local storage for auto-save
  const [savedData, setSavedData, removeSavedData] = useLocalStorage<SavedData | null>(STORAGE_KEY, null);

  // Load saved data on mount
  useEffect(() => {
    if (savedData && !isResetting.current) {
      setCells(savedData.cells);
      setGridConfig(savedData.gridConfig);
      setClassInfo(savedData.classInfo);
      addToast('Previous session restored', 'info');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save when data changes
  useEffect(() => {
    if (!isResetting.current && historyIndex >= 0) {
      const data: SavedData = {
        cells,
        gridConfig,
        classInfo,
        timestamp: Date.now()
      };
      setSavedData(data);
    }
  }, [cells, gridConfig, classInfo, historyIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      const initialState: HistoryState = {
        cells: savedData?.cells || [],
        gridConfig: savedData?.gridConfig || { rows: 5, cols: 6, boardPosition: 'top', autoResize: true },
        classInfo: savedData?.classInfo || { name: '', subtitle: '' }
      };
      setHistory([initialState]);
      setHistoryIndex(0);
      
      if (savedData) {
        setCells(savedData.cells);
        setGridConfig(savedData.gridConfig);
        setClassInfo(savedData.classInfo);
      }
    }
  }, [history.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Simple history push - no debouncing to avoid state issues
  const pushToHistory = useCallback((newState: HistoryState) => {
    if (isHistoryUpdate.current || isResetting.current) return;
    
    setHistory(prev => {
      const currentIdx = historyIndexRef.current;
      const newHistory = prev.slice(0, currentIdx + 1);
      const nextHistory = [...newHistory, newState];
      return nextHistory.slice(-MAX_HISTORY);
    });
    
    setHistoryIndex(prev => {
      const nextIdx = prev + 1;
      return nextIdx >= MAX_HISTORY ? MAX_HISTORY - 1 : nextIdx;
    });
  }, []);

  const handleUndo = useCallback(() => {
    const currentIdx = historyIndexRef.current;
    if (currentIdx > 0) {
      isHistoryUpdate.current = true;
      const prevIndex = currentIdx - 1;
      const prevState = historyRef.current[prevIndex];
      
      setCells(prevState.cells);
      setGridConfig(prevState.gridConfig);
      setClassInfo(prevState.classInfo);
      setHistoryIndex(prevIndex);
      
      requestAnimationFrame(() => { 
        isHistoryUpdate.current = false; 
      });
    }
  }, []);

  const handleRedo = useCallback(() => {
    const currentIdx = historyIndexRef.current;
    const currentHistory = historyRef.current;
    if (currentIdx < currentHistory.length - 1) {
      isHistoryUpdate.current = true;
      const nextIndex = currentIdx + 1;
      const nextState = currentHistory[nextIndex];
      
      setCells(nextState.cells);
      setGridConfig(nextState.gridConfig);
      setClassInfo(nextState.classInfo);
      setHistoryIndex(nextIndex);
      
      requestAnimationFrame(() => { 
        isHistoryUpdate.current = false; 
      });
    }
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    createUndoShortcut(handleUndo),
    createRedoShortcut(handleRedo),
    createEscapeShortcut(() => {
      setShowMobileSettings(false);
      setShowResetConfirm(false);
      if (viewMode) setViewMode(false);
    }),
    createExportShortcut(() => {
      handleExport();
    }),
    {
      key: 's',
      ctrl: true,
      handler: (e) => {
        e.preventDefault();
        addToast('Auto-saving enabled - no need to manually save!', 'info');
      }
    }
  ]);

  // FIXED: Stable cell click handler
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
        addToast(`Merged ${rowSpan * colSpan} cells`, 'success');
      }
      return;
    }

    setCells(prev => {
      const existingIndex = prev.findIndex(c => c.row === row && c.col === col);
      let nextCells: CellData[];
      
      if (selectedTool === 'eraser') {
        if (existingIndex > -1) {
          nextCells = prev.filter((_, idx) => idx !== existingIndex);
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
  }, [selectedTool, viewMode, mergeAnchor, gridConfig, classInfo, pushToHistory, addToast]);

  // FIXED: Name change without breaking reactivity
  const handleCellNameChange = useCallback((row: number, col: number, name: string) => {
    if (viewMode) return;
    setCells(prev => {
      const existingIndex = prev.findIndex(c => c.row === row && c.col === col);
      if (existingIndex > -1 && prev[existingIndex].name !== name) {
        const newCells = [...prev];
        newCells[existingIndex] = { ...newCells[existingIndex], name };
        return newCells;
      }
      return prev;
    });
  }, [viewMode]);

  const handleCellNameBlur = useCallback(() => {
    pushToHistory({ cells, gridConfig, classInfo });
  }, [cells, gridConfig, classInfo, pushToHistory]);

  const handleAddRow = useCallback((position: 'top' | 'bottom') => {
    if (gridConfig.rows >= MAX_ROWS) {
      addToast(`Maximum ${MAX_ROWS} rows reached`, 'error');
      return;
    }
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
  }, [gridConfig.rows, classInfo, pushToHistory, addToast]);

  const handleAddCol = useCallback((position: 'left' | 'right') => {
    if (gridConfig.cols >= MAX_COLS) {
      addToast(`Maximum ${MAX_COLS} columns reached`, 'error');
      return;
    }
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
  }, [gridConfig.cols, classInfo, pushToHistory, addToast]);

  const handleReset = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const confirmReset = useCallback(() => {
    isResetting.current = true;
    
    const resetConfig: GridConfig = {
      rows: 5,
      cols: 6,
      boardPosition: 'top',
      autoResize: true
    };
    const resetInfo = { name: '', subtitle: '' };
    
    setCells([]);
    setClassInfo(resetInfo);
    setGridConfig(resetConfig);
    setSelectedTool('student');
    setMergeAnchor(null);
    setViewMode(false);
    setShowMobileSettings(false);
    setRemountKey(prev => prev + 1);
    
    const initialState: HistoryState = {
      cells: [],
      gridConfig: resetConfig,
      classInfo: resetInfo
    };
    setHistory([initialState]);
    setHistoryIndex(0);
    removeSavedData();
    
    addToast('All data reset successfully', 'success');
    
    requestAnimationFrame(() => {
      isResetting.current = false;
    });
    setShowResetConfirm(false);
  }, [removeSavedData, addToast]);

  const handleExport = useCallback(async () => {
    const element = document.getElementById('petakelas-canvas');
    if (!element) {
      addToast('Canvas not found', 'error');
      return;
    }
    
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      const link = document.createElement('a');
      link.download = `${classInfo.name.replace(/\s+/g, '-').toLowerCase() || 'petakelas-plan'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      addToast('Image exported successfully', 'success');
    } catch (error) {
      console.error("Export failed", error);
      addToast('Failed to export image', 'error');
    } finally {
      setIsExporting(false);
      setShowMobileSettings(false);
    }
  }, [classInfo.name, addToast]);

  const toggleViewMode = useCallback(() => setViewMode(v => !v), []);
  const openSettings = useCallback(() => setShowMobileSettings(true), []);
  const closeSettings = useCallback(() => setShowMobileSettings(false), []);
  const setToolCallback = useCallback((t: ToolType) => { 
    setSelectedTool(t); 
    setMergeAnchor(null); 
  }, []);

  return (
    <>
      <div className="flex flex-col lg:flex-row h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
        <MobileHeader 
          className={classInfo.name}
          viewMode={viewMode}
          onToggleViewMode={toggleViewMode}
          onOpenSettings={openSettings}
        />

        <nav 
          className={`
            fixed bottom-0 left-0 right-0 z-40 lg:relative lg:z-30 lg:block lg:w-auto
            transition-transform duration-300 ease-in-out
            ${viewMode ? 'translate-y-full lg:translate-y-0 lg:-translate-x-full lg:hidden' : 'translate-y-0'}
            ${showMobileSettings ? 'hidden lg:block' : ''}
          `}
          aria-label="Tools"
        >
          <Toolbar currentTool={selectedTool} setTool={setToolCallback} />
        </nav>

        <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden bg-zinc-900/50" role="main">
          {/* OPTIMIZED: Static background instead of radial-gradient */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.02)',
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
            aria-hidden="true"
          />

          <div className={`flex-1 overflow-auto relative w-full h-full ${viewMode ? 'pb-0' : 'pb-20 sm:pb-24 lg:pb-0'}`}>
            <div className="min-h-full w-full flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 xl:p-12">
              <GridCanvas 
                key={remountKey}
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
                onClick={toggleViewMode}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-full shadow-2xl text-emerald-400 font-medium whitespace-nowrap"
                aria-label="Exit View Mode"
              >
                <EyeOff size={16} aria-hidden="true" /> Exit View Mode
              </button>
            </div>
          )}
        </main>

        <div 
          className={`
            fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden
            ${showMobileSettings ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `} 
          onClick={closeSettings}
          aria-hidden={!showMobileSettings}
        />

        <aside 
          className={`
            fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-zinc-950 shadow-2xl transform transition-transform duration-300 ease-out 
            lg:relative lg:transform-none lg:z-20 lg:shadow-2xl lg:shadow-black
            ${showMobileSettings ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            ${viewMode ? 'lg:hidden' : ''} 
          `}
          aria-label="Settings Panel"
        >
          <Sidebar 
            classInfo={classInfo}
            setClassInfo={setClassInfo}
            gridConfig={gridConfig}
            setGridConfig={setGridConfig}
            onExport={handleExport}
            isExporting={isExporting}
            onReset={handleReset}
            onClose={closeSettings}
            cells={cells}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
          />
        </aside>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset All Data?"
        message="This will permanently delete all your seating plan data. This action cannot be undone."
        confirmLabel="Reset Everything"
        cancelLabel="Keep Data"
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
        variant="danger"
      />

      <Toasts toasts={toasts} onRemove={removeToast} />
    </>
  );
}

function App() {
  const handleErrorReset = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  return (
    <ErrorBoundary onReset={handleErrorReset}>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
