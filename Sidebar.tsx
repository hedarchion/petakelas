
import React from 'react';
import { GridConfig, ClassInfo, BoardPosition, SidebarProps } from './types';
import { Button } from './components/Button';
import { Download, LayoutGrid, Settings2, Type, Square, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, X, Undo2, Redo2 } from 'lucide-react';

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
  const handleGridChange = (key: keyof GridConfig, value: number) => {
    const safeValue = Math.max(1, Math.min(20, value));
    setGridConfig(prev => ({ ...prev, [key]: safeValue }));
  };

  const handleBoardPosChange = (pos: BoardPosition) => {
    setGridConfig(prev => ({ ...prev, boardPosition: pos }));
  };

  const InputLabel = ({ icon: Icon, label }: { icon?: any, label: string }) => (
    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
    </div>
  );

  return (
    <div className="w-full md:w-80 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col h-full overflow-y-auto shadow-2xl">
      <div className="p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-emerald-900/10 rounded-xl border border-emerald-500/10">
                    <Settings2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-zinc-100 leading-none">Settings</h2>
                    <p className="text-xs text-zinc-500 mt-1">Configure your layout</p>
                </div>
            </div>
            {onClose && (
                <button 
                    onClick={onClose}
                    className="md:hidden p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-lg"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>

        {/* History Actions */}
        <div className="flex items-center gap-2">
            <Button 
                variant="secondary" 
                className="flex-1 py-2 text-xs" 
                onClick={onUndo} 
                disabled={!canUndo}
                icon={<Undo2 className="w-4 h-4" />}
            >
                Undo
            </Button>
            <Button 
                variant="secondary" 
                className="flex-1 py-2 text-xs" 
                onClick={onRedo} 
                disabled={!canRedo}
                icon={<Redo2 className="w-4 h-4" />}
            >
                Redo
            </Button>
        </div>

        {/* Class Info */}
        <div className="space-y-5">
            <InputLabel icon={Type} label="Class Details" />
            <div className="space-y-4">
                <div className="group">
                    <input 
                        type="text" 
                        value={classInfo.name}
                        onChange={(e) => setClassInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Class Name (e.g., Year 10 Physics)"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                </div>
                <div className="group">
                    <input 
                        type="text" 
                        value={classInfo.subtitle}
                        onChange={(e) => setClassInfo(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Subtitle (e.g., Room 402)"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                </div>
            </div>
        </div>

        {/* Grid Config */}
        <div className="space-y-5">
            <InputLabel icon={LayoutGrid} label="Grid Dimensions" />
            
            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 space-y-4">
                <div className="flex items-center justify-between">
                     <span className="text-sm text-zinc-400">Rows</span>
                     <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleGridChange('rows', gridConfig.rows - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        >-</button>
                        <span className="w-8 text-center font-mono text-emerald-400 font-bold">{gridConfig.rows}</span>
                        <button 
                             onClick={() => handleGridChange('rows', gridConfig.rows + 1)}
                             className="w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        >+</button>
                     </div>
                </div>

                <div className="flex items-center justify-between">
                     <span className="text-sm text-zinc-400">Columns</span>
                     <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleGridChange('cols', gridConfig.cols - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        >-</button>
                        <span className="w-8 text-center font-mono text-emerald-400 font-bold">{gridConfig.cols}</span>
                        <button 
                             onClick={() => handleGridChange('cols', gridConfig.cols + 1)}
                             className="w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        >+</button>
                     </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
                    <span className="text-sm text-zinc-400">Smart Corridor Sizing</span>
                    <button 
                        onClick={() => setGridConfig(prev => ({ ...prev, autoResize: !prev.autoResize }))}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${gridConfig.autoResize ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                        title="Automatically shrink rows/columns that only contain corridors"
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${gridConfig.autoResize ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>
        </div>

        {/* Board Position */}
        <div className="space-y-5">
            <InputLabel icon={Square} label="Whiteboard Location" />
            <div className="grid grid-cols-5 gap-2 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50">
                {[
                    { id: 'none', icon: X, label: 'None' },
                    { id: 'top', icon: ArrowUp, label: 'Top' },
                    { id: 'bottom', icon: ArrowDown, label: 'Btm' },
                    { id: 'left', icon: ArrowLeft, label: 'Left' },
                    { id: 'right', icon: ArrowRight, label: 'Right' },
                ].map((pos) => {
                    const isActive = gridConfig.boardPosition === pos.id;
                    return (
                        <button
                            key={pos.id}
                            onClick={() => handleBoardPosChange(pos.id as BoardPosition)}
                            className={`
                                flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all
                                ${isActive 
                                    ? 'bg-zinc-800 text-emerald-400 shadow-sm ring-1 ring-zinc-700' 
                                    : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'}
                            `}
                            title={pos.label}
                        >
                            <pos.icon className="w-4 h-4" />
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-zinc-800 mt-auto space-y-3 pb-6">
            <Button 
                onClick={onReset}
                variant="danger"
                className="w-full justify-center"
                icon={<RotateCcw className="w-4 h-4" />}
            >
                Reset All
            </Button>
            <Button 
                onClick={onExport} 
                className="w-full py-4 text-base shadow-xl shadow-emerald-900/20 justify-center" 
                variant="primary" 
                icon={isExporting ? <span className="animate-spin text-lg">⏳</span> : <Download className="w-5 h-5" />}
                disabled={isExporting}
            >
                {isExporting ? 'Generating Plan...' : 'Export High-Res PNG'}
            </Button>
        </div>

      </div>
    </div>
  );
};
