'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  UserPlus, 
  Camera, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: UserPlus, label: 'Registration', href: '/students/register' },
  { icon: Camera, label: 'Mark Attendance', href: '/attendance/mark' },
  { icon: FileText, label: 'Reports', href: '/reports' },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsOpen(!isOpen);

  const NavItem = ({ item }: { item: typeof menuItems[0] }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center px-4 py-3 rounded-2xl transition-all duration-300 group relative',
          isActive 
            ? 'bg-primary text-white shadow-lg shadow-primary/30' 
            : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50'
        )}
      >
        <item.icon className={cn('h-5 w-5 min-w-[20px]', !isCollapsed && 'mr-3')} />
        {!isCollapsed && <span className="font-medium">{item.label}</span>}
        {isCollapsed && (
          <div className="absolute left-14 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button size="icon" variant="outline" onClick={toggleMobile} className="glass">
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar Content */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? 80 : 280,
          x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -300 : 0)
        }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 transition-all duration-300 ease-in-out',
          !isOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between mb-8 px-2">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              <div className="p-2 bg-primary rounded-xl">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">SmartAtt</span>
            </motion.div>
          )}
          {isCollapsed && (
             <div className="p-2 bg-primary rounded-xl mx-auto">
               <Camera className="h-6 w-6 text-white" />
             </div>
          )}
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        {/* User Profile */}
        {!isCollapsed && (
          <div className="mb-8 px-2 p-4 glass rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{user?.username}</span>
                <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-1">
          {menuItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto space-y-2 px-1">
          <Link
            href="/settings"
            className="flex items-center px-4 py-3 rounded-2xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
          >
            <Settings className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
            {!isCollapsed && <span className="font-medium">Settings</span>}
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 rounded-2xl text-error hover:bg-error/10 transition-all"
          >
            <LogOut className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleMobile}
        />
      )}
    </>
  );
};
