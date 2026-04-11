'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  MoreVertical,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    date_from: '',
    date_to: '',
    page: 1,
  });
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance', { 
        params: { 
          ...filters,
          student_id: filters.search // The backend might support student_id or search
        } 
      });
      setRecords(res.data.records);
      setTotalPages(res.data.pages);
    } catch (e) {
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filters.page, filters.status, filters.date_from, filters.date_to]);

  const handleExport = async (type: 'csv' | 'excel' | 'pdf') => {
    toast.loading(`Preparing ${type.toUpperCase()} export...`, { id: 'export' });
    try {
      const res = await api.get(`/attendance/export/${type}`, {
        responseType: 'blob',
        params: {
          date_from: filters.date_from,
          date_to: filters.date_to
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.${type === 'excel' ? 'xlsx' : type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported successfully!', { id: 'export' });
    } catch (e) {
      toast.error('Export failed.', { id: 'export' });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Attendance Reports</h1>
          <p className="text-slate-500">View, filter, and export attendance history records.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <FileText className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button size="sm" onClick={() => handleExport('pdf')}>
            <Download className="mr-2 h-4 w-4" /> PDF Report
          </Button>
        </div>
      </div>

      <Card className="glass overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input 
                 placeholder="Search by student name or ID..." 
                 className="pl-10"
                 onBlur={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                 onKeyDown={(e) => e.key === 'Enter' && setFilters({ ...filters, search: (e.target as HTMLInputElement).value, page: 1 })}
               />
            </div>
            <select 
              className="h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </select>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                type="date" 
                className="pl-10" 
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Student Info</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded" /></td>
                        <td className="px-6 py-4 text-right"><div className="h-4 w-4 bg-slate-100 dark:bg-slate-800 rounded float-right" /></td>
                      </tr>
                    ))
                  ) : (
                    records.map((record) => (
                      <motion.tr 
                        key={record.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                           <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                {record.student_photo ? (
                                   <img src={`data:image/jpeg;base64,${record.student_photo}`} alt="" className="h-full w-full object-cover rounded-xl" />
                                ) : (
                                  <User className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{record.student_name}</p>
                                <p className="text-xs text-slate-500">{record.student_id}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-sm text-slate-700 dark:text-slate-300">{record.department || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-sm font-medium">{format(new Date(record.timestamp), 'MMM dd, yyyy')}</span>
                              <span className="text-xs text-slate-500">{format(new Date(record.timestamp), 'hh:mm a')}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant={record.status === 'present' ? 'success' : 'warning'}>
                             {record.status}
                           </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500">
                           {((record.confidence_score || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-right">
                           <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4" />
                           </Button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
             <p className="text-sm text-slate-500">
               Showing <span className="font-bold">{records.length}</span> records
             </p>
             <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={filters.page === 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-1">
                   {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setFilters({ ...filters, page: i + 1 })}
                        className={cn(
                          "h-8 w-8 rounded-lg text-xs font-bold transition-all",
                          filters.page === i + 1 
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        )}
                      >
                        {i + 1}
                      </button>
                   ))}
                </div>
                <Button 
                  variant="outline" 
                   size="icon" 
                   disabled={filters.page === totalPages}
                   onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
             </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Detail Panel Hint */}
      {!loading && records.length > 0 && (
         <div className="text-center">
            <p className="text-xs text-slate-400">Tip: Click on a row to view detailed face encoding analysis and high-res capture.</p>
         </div>
      )}
    </div>
  );
}
