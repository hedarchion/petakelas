
import React from 'react';

export type ToolType = 'student' | 'teacher' | 'corridor-horizontal' | 'corridor-vertical' | 'eraser' | 'merge';

export type BoardPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

export interface CellData {
  id: string; // row-col
  row: number;
  col: number;
  type: ToolType;
  name?: string;
  rowSpan?: number;
  colSpan?: number;
}

export interface GridConfig {
  rows: number;
  cols: number;
  boardPosition: BoardPosition;
  autoResize: boolean;
}

export interface ClassInfo {
  name: string;
  subtitle: string;
}

export interface SidebarProps {
  classInfo: ClassInfo;
  setClassInfo: React.Dispatch<React.SetStateAction<ClassInfo>>;
  gridConfig: GridConfig;
  setGridConfig: React.Dispatch<React.SetStateAction<GridConfig>>;
  onExport: () => void;
  isExporting: boolean;
  onReset: () => void;
  onClose?: () => void;
  cells: CellData[];
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface ToolbarProps {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
}
