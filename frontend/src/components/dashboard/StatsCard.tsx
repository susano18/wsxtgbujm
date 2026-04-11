import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
}

export const StatsCard = ({ title, value, icon: Icon, description, trend, color = 'primary' }: StatsCardProps) => {
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    secondary: 'text-secondary bg-secondary/10 border-secondary/20',
    accent: 'text-accent bg-accent/10 border-accent/20',
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
  };

  return (
    <Card className="p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <motion.h4 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-slate-900 dark:text-white"
          >
            {value}
          </motion.h4>
        </div>
        <div className={cn('p-3 rounded-2xl border backdrop-blur-sm', colorMap[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        {trend && (
          <span className={cn(
            'text-xs font-bold px-2 py-1 rounded-lg',
            trend.isUp ? 'text-success bg-success/10' : 'text-error bg-error/10'
          )}>
            {trend.isUp ? '+' : '-'}{trend.value}%
          </span>
        )}
      </div>

      {/* Background Decoration */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-current opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
    </Card>
  );
};
