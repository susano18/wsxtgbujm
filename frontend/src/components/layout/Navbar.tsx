'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-20 bg-background/50 backdrop-blur-md">
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search student or record..." 
            className="pl-10 h-10 bg-slate-100/50 border-transparent dark:bg-slate-800/50"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 ml-auto">
        <button className="p-2 relative rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full border-2 border-background"></span>
        </button>
        
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none mb-1">
              Welcome, {user?.username}
            </p>
            <p className="text-xs text-slate-500 leading-none">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
              alt="Avatar"
              className="h-8 w-8"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
