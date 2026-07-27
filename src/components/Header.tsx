'use client';

import { Bell, User, LogOut } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-8">
      <div className="text-slate-300 text-sm">
        Welcome to Research Vault
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
          <Bell size={20} />
        </button>
        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
          <User size={20} />
        </button>
        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
