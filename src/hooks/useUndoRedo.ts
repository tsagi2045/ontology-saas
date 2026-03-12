import { create } from 'zustand';

interface UndoAction {
  id: string;
  description: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  timestamp: number;
}

interface UndoRedoState {
  undoStack: UndoAction[];
  redoStack: UndoAction[];
  push: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void;
  undo: () => Promise<UndoAction | null>;
  redo: () => Promise<UndoAction | null>;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useUndoRedo = create<UndoRedoState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  push: (action) => {
    const entry: UndoAction = {
      ...action,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    };
    set(state => ({
      undoStack: [...state.undoStack.slice(-49), entry], // keep max 50
      redoStack: [], // clear redo on new action
    }));
  },

  undo: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;
    const action = undoStack[undoStack.length - 1];
    await action.undo();
    set(state => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, action],
    }));
    return action;
  },

  redo: async () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;
    const action = redoStack[redoStack.length - 1];
    await action.redo();
    set(state => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, action],
    }));
    return action;
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  clear: () => set({ undoStack: [], redoStack: [] }),
}));
