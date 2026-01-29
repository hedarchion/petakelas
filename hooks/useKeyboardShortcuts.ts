
import { useEffect, useCallback, useRef } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], deps: React.DependencyList = []) {
  const shortcutsRef = useRef(shortcuts);
  
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    for (const shortcut of shortcutsRef.current) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = !!shortcut.shift === event.shiftKey;
      const altMatch = !!shortcut.alt === event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler(event);
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, ...deps]);
}

// Preset shortcuts for common actions
export const createUndoShortcut = (onUndo: () => void): ShortcutConfig => ({
  key: 'z',
  ctrl: true,
  handler: onUndo,
  preventDefault: true
});

export const createRedoShortcut = (onRedo: () => void): ShortcutConfig => ({
  key: 'y',
  ctrl: true,
  handler: onRedo,
  preventDefault: true
});

export const createEscapeShortcut = (onEscape: () => void): ShortcutConfig => ({
  key: 'Escape',
  handler: onEscape,
  preventDefault: false
});

export const createExportShortcut = (onExport: () => void): ShortcutConfig => ({
  key: 'e',
  ctrl: true,
  shift: true,
  handler: onExport,
  preventDefault: true
});

export const createResetShortcut = (onReset: () => void): ShortcutConfig => ({
  key: 'r',
  ctrl: true,
  shift: true,
  alt: true,
  handler: onReset,
  preventDefault: true
});
