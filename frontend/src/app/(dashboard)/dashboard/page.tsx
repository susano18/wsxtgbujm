'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  MoreHorizontal,
  ArrowUpRight,
  UserCheck
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import api from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const dummyData = [
  { name: 'Mon', present: 45, late: 5 },
  { name: 'Tue', present: 52, late: 2 },
  { name: 'Wed', present: 48, late: 8 },
  { name: 'Thu', present: 61, late: 4 },
  { name: 'Fri', present: 55, late: 6 },
  { name: 'Sat', present: 40, late: 3 },
  { name: 'Sun', present: 38, late: 2 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, dailyRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/daily'),
        ]);
        setStats(dashRes.data);
        setDailyStats(dailyRes.data.daily_stats);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-slate-100 dark:bg-slate-800 rounded-3xl" />
          <div className="h-[400px] bg-slate-100 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Overview of system health and attendance trends.</p>
        </div>
        <Button className="w-fit">
          <Calendar className="mr-2 h-4 w-4" />
          Custom Range
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Students"
          value={stats?.total_students || 0}
          icon={Users}
          description="Registered students in database"
          trend={{ value: 12, isUp: true }}
          color="primary"
        />
        <StatsCard 
          title="Marked Today"
          value={stats?.today?.total_marked || 0}
          icon={UserCheck}
          description="Students recognized today"
          color="secondary"
        />
        <StatsCard 
          title="Attendance Rate"
          value={`${stats?.today?.attendance_rate || 0}%`}
          icon={TrendingUp}
          description="Average rate for today"
          trend={{ value: 5, isUp: true }}
          color="success"
        />
        <StatsCard 
          title="Active Cameras"
          value="4"
          icon={Clock}
          description="Nodes active across campus"
          color="warning"
        />
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Daily attendance distribution for the last 7 days</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats.length > 0 ? dailyStats : dummyData}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="present" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPresent)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="late" 
                  stroke="#f43f5e" 
                  strokeWidth={3}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profile Completion or Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Insights</CardTitle>
            <CardDescription>Quick summary of system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: 'New Students Joined', value: '24', icon: UserPlus, color: 'text-primary' },
                { label: 'Early Birds (Before 8AM)', value: '82%', icon: Clock, color: 'text-success' },
                { label: 'System Uptime', value: '99.9%', icon: CheckCircle2, color: 'text-secondary' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className={cn('p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors', item.color)}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.value} marked since yesterday</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              ))}
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" className="w-full">View Detailed Analytics</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Re-defining UserPlus as it's not imported
const UserPlus = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
);
