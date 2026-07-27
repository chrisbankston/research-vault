'use client';

import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({ placeholder = 'Search research...', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleClear = () => {
    setQuery('');
    onSearch?.('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
        <Search size={20} />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="w-full pl-10 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
