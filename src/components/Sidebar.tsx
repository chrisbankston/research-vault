'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, BarChart3, BookMarked, MessageSquare, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/areas', label: 'Workspaces', icon: BookOpen },
    { href: '/research', label: 'Research Library', icon: BookMarked },
    { href: '/chat', label: 'Ask Research Vault', icon: MessageSquare },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Research Vault</h1>
            <p className="text-xs text-slate-400">Knowledge Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/research' ? pathname.startsWith('/research') : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link
          href="/research/upload"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          New Capture
        </Link>
      </div>
    </div>
  );
}
