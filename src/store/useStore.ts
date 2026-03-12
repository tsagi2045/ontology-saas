import { create } from 'zustand';
import type { Entity, Relation, OntologyClass, PredicateType, InferenceRule } from '@/types';

interface AppState {
  // Data
  entities: Entity[];
  relations: Relation[];
  classes: OntologyClass[];
  predicates: PredicateType[];
  rules: InferenceRule[];

  // UI state
  selectedEntityId: string | null;
  selectedRelationId: string | null;
  sidebarOpen: boolean;
  graphClassFilter: string[];
  graphPredicateFilter: string[];

  // Actions
  setEntities: (entities: Entity[]) => void;
  setRelations: (relations: Relation[]) => void;
  setClasses: (classes: OntologyClass[]) => void;
  setPredicates: (predicates: PredicateType[]) => void;
  setRules: (rules: InferenceRule[]) => void;
  setSelectedEntityId: (id: string | null) => void;
  setSelectedRelationId: (id: string | null) => void;
  toggleSidebar: () => void;
  setGraphClassFilter: (filter: string[]) => void;
  setGraphPredicateFilter: (filter: string[]) => void;

  // Data fetching
  fetchEntities: () => Promise<void>;
  fetchClasses: () => Promise<void>;
  fetchPredicates: () => Promise<void>;
  fetchRules: () => Promise<void>;
  fetchRelations: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  entities: [],
  relations: [],
  classes: [],
  predicates: [],
  rules: [],
  selectedEntityId: null,
  selectedRelationId: null,
  sidebarOpen: true,
  graphClassFilter: [],
  graphPredicateFilter: [],

  setEntities: (entities) => set({ entities }),
  setRelations: (relations) => set({ relations }),
  setClasses: (classes) => set({ classes }),
  setPredicates: (predicates) => set({ predicates }),
  setRules: (rules) => set({ rules }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id, selectedRelationId: null }),
  setSelectedRelationId: (id) => set({ selectedRelationId: id, selectedEntityId: null }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setGraphClassFilter: (filter) => set({ graphClassFilter: filter }),
  setGraphPredicateFilter: (filter) => set({ graphPredicateFilter: filter }),

  fetchEntities: async () => {
    const res = await fetch('/api/entities?pageSize=1000');
    const data = await res.json();
    set({ entities: data.items });
  },
  fetchClasses: async () => {
    const res = await fetch('/api/classes');
    const data = await res.json();
    set({ classes: data.items });
  },
  fetchPredicates: async () => {
    const res = await fetch('/api/predicates');
    const data = await res.json();
    set({ predicates: data.items });
  },
  fetchRules: async () => {
    const res = await fetch('/api/rules');
    const data = await res.json();
    set({ rules: data.items });
  },
  fetchRelations: async () => {
    const res = await fetch('/api/relations');
    const data = await res.json();
    set({ relations: data.items });
  },
}));
