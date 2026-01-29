
import React, { useCallback, memo } from 'react';
import { GridConfig, ClassInfo, BoardPosition, SidebarProps } from '../types';
import { Button } from './Button';
import { Download, LayoutGrid, Settings2, Type, Square, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, X, Undo2, Redo2, LucideIcon } from 'lucide-react';

interface InputLabelProps {
  icon?: LucideIcon;
  label: string;
}

const InputLabel = memo(({ icon: Icon, label }: InputLabelProps) => (
  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
    {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
    <span>{label}</span>
  </div>
));
InputLabel.displayName = 'InputLabel';

interface BoardPositionButtonProps {
  pos: { id: BoardPosition; icon: LucideIcon; label: string };
  isActive: boolean;
  onClick: () => void;
}

const BoardPositionButton = memo(({ pos, isActive, onClick }: BoardPositionButtonProps) => (
  <button
    key={pos.id}
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all
      ${isActive 
        ? 'bg-zinc-800 text-emerald-400 shadow-sm ring-1 ring-zinc-700' 
        : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'}
    `}
    title={pos.label}
    aria-label={`Set whiteboard position to ${pos.label}`}
    aria-pressed={isActive}
  >
    <pos.icon className="w-4 h-4" aria-hidden="true" />
  </button>
));
BoardPositionButton.displayName = 'BoardPositionButton';

export const Sidebar: React.FC<SidebarProps> = ({
  classInfo,
  setClassInfo,
  gridConfig,
  setGridConfig,
  onExport,
  isExporting,
  onReset,
  onClose,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const handleGridChange = useCallback((key: keyof GridConfig, value: number) => {
    const safeValue = Math.max(1, Math.min(20, value));
    setGridConfig(prev => ({ ...prev, [key]: safeValue }));
  }, [setGridConfig]);

  const handleBoardPosChange = useCallback((pos: BoardPosition) => {
    setGridConfig(prev => ({ ...prev, boardPosition: pos }));
  }, [setGridConfig]);

  const handleToggleAutoResize = useCallback(() => {
    setGridConfig(prev => ({ ...prev, autoResize: !prev.autoResize }));
  }, [setGridConfig]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setClassInfo(prev => ({ ...prev, name: e.target.value }));
  }, [setClassInfo]);

  const handleSubtitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setClassInfo(prev => ({ ...prev, subtitle: e.target.value }));
  }, [setClassInfo]);

  const boardPositions = [
    { id: 'none' as BoardPosition, icon: X, label: 'None' },
    { id: 'top' as BoardPosition, icon: ArrowUp, label: 'Top' },
    { id: 'bottom' as BoardPosition, icon: ArrowDown, label: 'Bottom' },
    { id: 'left' as BoardPosition, icon: ArrowLeft, label: 'Left' },
    { id: 'right' as BoardPosition, icon: ArrowRight, label: 'Right' },
  ];

  return (
    <div className="w-full sm:w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col h-full overflow-y-auto shadow-2xl">
      <div className="p-6 space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-emerald-500/20 to-emerald-900/10 rounded-xl border border-emerald-500/10">
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 leading-none">Settings</h2>
              <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">Configure your layout</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-lg transition-colors"
              aria-label="Close settings panel"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </header>

        {/* History Actions */}
        <nav aria-label="History actions">
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              className="flex-1 py-2 text-xs" 
              onClick={onUndo} 
              disabled={!canUndo}
              icon={<Undo2 className="w-4 h-4" />}
              aria-label="Undo last action"
              title={canUndo ? "Undo (Ctrl+Z)" : "Nothing to undo"}
            >
              Undo
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 py-2 text-xs" 
              onClick={onRedo} 
              disabled={!canRedo}
              icon={<Redo2 className="w-4 h-4" />}
              aria-label="Redo last action"
              title={canRedo ? "Redo (Ctrl+Y)" : "Nothing to redo"}
            >
              Redo
            </Button>
          </div>
        </nav>

        {/* Class Info */}
        <section aria-labelledby="class-details-heading">
          <InputLabel icon={Type} label="Class Details" />
          <h3 id="class-details-heading" className="sr-only">Class Details</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="group">
              <label htmlFor="class-name" className="sr-only">Class Name</label>
              <input 
                id="class-name"
                type="text" 
                value={classInfo.name}
                onChange={handleNameChange}
                placeholder="Class Name (e.g., Year 10 Physics)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                maxLength={100}
              />
            </div>
            <div className="group">
              <label htmlFor="class-subtitle" className="sr-only">Subtitle</label>
              <input 
                id="class-subtitle"
                type="text" 
                value={classInfo.subtitle}
                onChange={handleSubtitleChange}
                placeholder="Subtitle (e.g., Room 402)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                maxLength={100}
              />
            </div>
          </div>
        </section>

        {/* Grid Config */}
        <section aria-labelledby="grid-dimensions-heading">
          <InputLabel icon={LayoutGrid} label="Grid Dimensions" />
          <h3 id="grid-dimensions-heading" className="sr-only">Grid Dimensions</h3>
          
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 space-y-4">
            {/* Rows */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400" id="rows-label">Rows</span>
              <div className="flex items-center gap-3" role="group" aria-labelledby="rows-label">
                <button 
                  onClick={() => handleGridChange('rows', gridConfig.rows - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Decrease rows"
                  disabled={gridConfig.rows <= 1}
                >
                  -
                </button>
                <span className="w-8 text-center font-mono text-emerald-400 font-bold" aria-live="polite">
                  {gridConfig.rows}
                </span>
                <button 
                  onClick={() => handleGridChange('rows', gridConfig.rows + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Increase rows"
                  disabled={gridConfig.rows >= 20}
                >
                  +
                </button>
              </div>
            </div>

            {/* Columns */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400" id="cols-label">Columns</span>
              <div className="flex items-center gap-3" role="group" aria-labelledby="cols-label">
                <button 
                  onClick={() => handleGridChange('cols', gridConfig.cols - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Decrease columns"
                  disabled={gridConfig.cols <= 1}
                >
                  -
                </button>
                <span className="w-8 text-center font-mono text-emerald-400 font-bold" aria-live="polite">
                  {gridConfig.cols}
                </span>
                <button 
                  onClick={() => handleGridChange('cols', gridConfig.cols + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Increase columns"
                  disabled={gridConfig.cols >= 20}
                >
                  +
                </button>
              </div>
            </div>

            {/* Auto Resize Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
              <span className="text-sm text-zinc-400" id="auto-resize-label">Smart Corridor Sizing</span>
              <button 
                onClick={handleToggleAutoResize}
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${gridConfig.autoResize ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                title="Automatically shrink rows/columns that only contain corridors"
                aria-label="Toggle smart corridor sizing"
                aria-pressed={gridConfig.autoResize}
                aria-labelledby="auto-resize-label"
              >
                <span 
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${gridConfig.autoResize ? 'translate-x-6' : 'translate-x-0'}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </section>

        {/* Board Position */}
        <section aria-labelledby="whiteboard-position-heading">
          <InputLabel icon={Square} label="Whiteboard Location" />
          <h3 id="whiteboard-position-heading" className="sr-only">Whiteboard Location</h3>
          <div 
            className="grid grid-cols-5 gap-2 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50"
            role="radiogroup"
            aria-label="Whiteboard position"
          >
            {boardPositions.map((pos) => (
              <BoardPositionButton
                key={pos.id}
                pos={pos}
                isActive={gridConfig.boardPosition === pos.id}
                onClick={() => handleBoardPosChange(pos.id)}
              />
            ))}
          </div>
        </section>

        {/* Actions */}
        <footer className="pt-6 border-t border-zinc-800 mt-auto space-y-3 pb-6">
          <Button 
            onClick={onReset}
            variant="danger"
            className="w-full justify-center"
            icon={<RotateCcw className="w-4 h-4" />}
            aria-label="Reset all data"
            title="Reset all data (Ctrl+Shift+Alt+R)"
          >
            Reset All
          </Button>
          <Button 
            onClick={onExport} 
            className="w-full py-4 text-base shadow-xl shadow-emerald-900/20 justify-center" 
            variant="primary" 
            icon={isExporting ? <span className="animate-spin text-lg" aria-hidden="true">⏳</span> : <Download className="w-5 h-5" />}
            disabled={isExporting}
            aria-label={isExporting ? "Exporting image" : "Export as PNG image"}
            title="Export as PNG (Ctrl+Shift+E)"
          >
            {isExporting ? 'Generating Plan...' : 'Export High-Res PNG'}
          </Button>
        </footer>

      </div>
    </div>
  );
};
