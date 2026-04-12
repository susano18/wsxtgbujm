'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  LogOut,
  User as UserIcon,
  BookOpen,
  Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      router.push('/student/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await api.get(`/analytics/student/${user.id}/stats`);
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch student stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome, {user?.name}!</h1>
              <p className="text-slate-500">{user?.student_id} • {user?.department}</p>
            </div>
          </div>
          <Button variant="outline" className="h-12 border-error/20 text-error hover:bg-error/10" onClick={logout}>
            <LogOut className="mr-2 h-5 w-5" /> Logout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <StatCard
            title="Attendance Rate"
            value={`${stats?.statistics?.attendance_percentage || 0}%`}
            icon={TrendingUp}
            color="text-primary"
            bg="bg-primary/10"
           />
           <StatCard
            title="Present Days"
            value={stats?.statistics?.present || 0}
            icon={CheckCircle2}
            color="text-success"
            bg="bg-success/10"
           />
           <StatCard
            title="Late Entries"
            value={stats?.statistics?.late || 0}
            icon={Clock}
            color="text-warning"
            bg="bg-warning/10"
           />
           <StatCard
            title="Department Rank"
            value="N/A"
            icon={BookOpen}
            color="text-accent"
            bg="bg-accent/10"
           />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           {/* Recent Activity */}
           <Card className="lg:col-span-2 glass">
              <CardHeader className="flex flex-row items-center justify-between">
                 <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-primary" />
                    Recent Attendance
                 </CardTitle>
                 <Button variant="outline" size="sm" onClick={async () => {
                    try {
                       const res = await api.get('/attendance/export/csv', {
                          params: { student_id: user?.student_id },
                          responseType: 'blob'
                       });
                       const url = window.URL.createObjectURL(new Blob([res.data]));
                       const link = document.createElement('a');
                       link.href = url;
                       link.setAttribute('download', `my_attendance_${user?.student_id}.csv`);
                       document.body.appendChild(link);
                       link.click();
                       link.remove();
                       toast.success('Report downloaded');
                    } catch (err) {
                       toast.error('Failed to export records');
                    }
                 }}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                 </Button>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    {stats?.recent_7_days?.map((record: any) => (
                      <div key={record.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                         <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-xl ${record.status === 'present' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                               {record.status === 'present' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                            </div>
                            <div>
                               <p className="font-bold">{format(new Date(record.date), 'MMMM dd, yyyy')}</p>
                               <p className="text-xs text-slate-500">{format(new Date(record.time_in), 'hh:mm:ss a')}</p>
                            </div>
                         </div>
                         <Badge variant={record.status === 'present' ? 'success' : 'warning'}>
                            {record.status}
                         </Badge>
                      </div>
                    ))}
                    {(!stats?.recent_7_days || stats.recent_7_days.length === 0) && (
                      <div className="text-center py-12 text-slate-400 italic">
                         No records found for the last 7 days.
                      </div>
                    )}
                 </div>
              </CardContent>
           </Card>

           {/* Profile Details */}
           <Card className="glass">
              <CardHeader>
                 <CardTitle className="flex items-center">
                    <UserIcon className="mr-2 h-5 w-5 text-primary" />
                    Student Profile
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <DetailItem label="Full Name" value={user?.name} />
                 <DetailItem label="Student ID" value={user?.student_id} />
                 <DetailItem label="Email" value={user?.email} />
                 <DetailItem label="Department" value={user?.department} />
                 <DetailItem label="Year of Study" value={user?.year} />
                 <DetailItem label="Joined Date" value={user?.created_at ? format(new Date(user?.created_at), 'MMM dd, yyyy') : 'N/A'} />
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="glass overflow-hidden group">
       <CardContent className="p-6">
          <div className="flex items-center justify-between">
             <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-black">{value}</p>
             </div>
             <div className={`p-4 rounded-2xl ${bg} ${color} group-hover:scale-110 transition-transform`}>
                <Icon className="h-8 w-8" />
             </div>
          </div>
       </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: any) {
  return (
    <div className="space-y-1">
       <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
       <p className="font-semibold text-slate-900 dark:text-white">{value || 'Not provided'}</p>
    </div>
  );
}
