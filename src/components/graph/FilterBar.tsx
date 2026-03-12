'use client';

import type { OntologyClass, PredicateType } from '@/types';

interface FilterBarProps {
  classes: OntologyClass[];
  predicates: PredicateType[];
  classFilter: string[];
  predicateFilter: string[];
  onClassFilterChange: (filter: string[]) => void;
  onPredicateFilterChange: (filter: string[]) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function FilterBar({
  classes, predicates, classFilter, predicateFilter,
  onClassFilterChange, onPredicateFilterChange,
  searchQuery, onSearchChange,
}: FilterBarProps) {
  // Get top-level classes only for filtering
  const rootClasses = classes.filter(c => !c.parentClassId);

  const toggleClass = (id: string) => {
    if (classFilter.includes(id)) {
      onClassFilterChange(classFilter.filter(c => c !== id));
    } else {
      onClassFilterChange([...classFilter, id]);
    }
  };

  return (
    <div className="bg-[#111] border-b border-[#2a2a2a] px-4 py-2 flex items-center gap-4 flex-wrap">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
        <input
          type="text"
          placeholder="노드 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-7 pr-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md text-xs text-white w-40 focus:outline-none focus:border-[#E85D3A]"
        />
      </div>

      <div className="w-px h-5 bg-[#2a2a2a]" />

      {/* Class filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-gray-500 mr-1">클래스:</span>
        {rootClasses.map(cls => {
          const isActive = classFilter.length === 0 || classFilter.includes(cls.id);
          return (
            <button
              key={cls.id}
              onClick={() => toggleClass(cls.id)}
              className={`px-2 py-0.5 rounded-full text-xs transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-gray-600 opacity-50'
              }`}
              style={{
                backgroundColor: isActive ? `${cls.color}25` : 'transparent',
                border: `1px solid ${isActive ? cls.color + '50' : '#2a2a2a'}`,
                color: isActive ? cls.color : undefined,
              }}
            >
              {cls.icon} {cls.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
