'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, ShieldCheck, UserX, Clock, History, MoreHorizontal, User, Scan } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecognitionResult {
  match: boolean;
  name?: string;
  student_id?: string;
  confidence?: number;
  message?: string;
  status?: 'present' | 'late' | 'unknown';
}

export default function AttendanceMarking() {
  const webcamRef = useRef<Webcam>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [recentMarks, setRecentMarks] = useState<any[]>([]);
  const [isAutoScanning, setIsAutoScanning] = useState(false);

  // Load recent attendance on mount
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get('/attendance', { params: { per_page: 5 } });
        setRecentMarks(res.data.records || []);
      } catch (e) {
        console.error('Failed to fetch recent attendance', e);
      }
    };
    fetchRecent();
  }, [result]);

  const captureAndMark = useCallback(async () => {
    if (isProcessing) return;

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error('Could not capture image from camera.');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // Convert base64 to blob
      const fetchRes = await fetch(imageSrc);
      const blob = await fetchRes.blob();
      const formData = new FormData();
      formData.append('image', blob, 'capture.jpg');

      const response = await api.post('/attendance/mark', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;
      if (data.results && data.results.length > 0) {
        const face = data.results[0];
        
        if (face.status === 'unknown') {
          setResult({ match: false, message: 'Identity could not be verified.' });
          toast.error('Unknown face detected.');
        } else {
          const res: RecognitionResult = {
            match: true,
            name: face.student.name,
            student_id: face.student.student_id,
            confidence: face.confidence,
            status: face.status,
            message: face.message
          };
          setResult(res);
          toast.success(
            face.status === 'already_marked' 
              ? `Welcome back, ${face.student.name}!` 
              : `Welcome, ${face.student.name}!`
          );
        }
      } else {
        setResult({ match: false, message: 'Identity could not be verified.' });
        toast.error('Unknown face detected.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Recognition failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  // Handle auto-scan logic
  useEffect(() => {
    let interval: any;
    if (isAutoScanning && !isProcessing) {
      interval = setInterval(() => {
        captureAndMark();
      }, 5000); // Scan every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoScanning, isProcessing, captureAndMark]);

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Camera Feed Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Attendance Terminal</h1>
            <p className="text-slate-500">Fast and secure face recognition node.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={cn("inline-block w-2 h-2 rounded-full animate-pulse", isAutoScanning ? "bg-success" : "bg-slate-300")} />
            <span className="text-sm font-medium text-slate-500">{isAutoScanning ? 'Scanning Active' : 'Idle'}</span>
          </div>
        </div>

        <div className="relative aspect-video rounded-3xl overflow-hidden glass bg-slate-950 border-4 border-slate-200 dark:border-slate-800">
           <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="h-full w-full object-cover grayscale-[0.2]"
            />
            
            {/* HUD / Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <AnimatePresence>
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-primary/5 flex items-center justify-center"
                  >
                    <div className="relative">
                       <Scan className="h-48 w-48 text-primary/40 animate-pulse" />
                       <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-[-20%] right-[-20%] h-0.5 bg-primary shadow-[0_0_15px_rgba(99,102,241,0.8)] z-10"
                       />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success/Failure feedback overlay */}
              <AnimatePresence>
                {result && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "absolute inset-0 flex items-center justify-center backdrop-blur-[2px]",
                      result.match ? "bg-success/10" : "bg-error/10"
                    )}
                  >
                    <Card className="max-w-xs w-full text-center border-2 border-white/20 p-6 shadow-2xl">
                       <div className={cn(
                         "h-20 w-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white",
                         result.match ? "bg-success shadow-lg shadow-success/30" : "bg-error shadow-lg shadow-error/30"
                       )}>
                         {result.match ? <ShieldCheck className="h-10 w-10" /> : <UserX className="h-10 w-10" />}
                       </div>
                       <h3 className="text-xl font-bold dark:text-white">
                         {result.match ? result.name : 'Unknown Face'}
                       </h3>
                       <p className="text-sm text-slate-500 mb-4">{result.message}</p>
                       <Badge variant={result.match ? 'success' : 'error'}>
                          {result.match ? `Conf: ${((result.confidence || 0) * 100).toFixed(1)}%` : 'Access Denied'}
                       </Badge>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-6 pointer-events-auto">
               <Button 
                variant={isAutoScanning ? 'outline' : 'ghost'} 
                className={cn('h-14 bg-white/10 border-white/20 text-white backdrop-blur-md', isAutoScanning && 'bg-primary/20 border-primary/40 text-primary')}
                onClick={() => setIsAutoScanning(!isAutoScanning)}
               >
                 {isAutoScanning ? 'Stop Auto' : 'Auto Scan'}
               </Button>
               <Button 
                size="lg" 
                className="h-20 w-20 rounded-full p-0 shadow-2xl hover:scale-110 active:scale-95 transition-transform"
                onClick={captureAndMark}
                isLoading={isProcessing}
               >
                 <Camera className="h-8 w-8 text-white" />
               </Button>
            </div>
        </div>
      </div>

      {/* Sidebar - Recent Records */}
      <div className="space-y-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            {/* Re-defining UserPlus as it's not imported */}
            {(() => {
              const UserPlus = ({ className }: { className?: string }) => (
                <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
              );
              return null;
            })()}
            <div>
              <CardTitle className="text-lg">Recent Feed</CardTitle>
              <CardDescription>Live identification log</CardDescription>
            </div>
            <History className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto custom-scrollbar px-2">
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {recentMarks.map((record, idx) => (
                  <motion.div 
                    key={record.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden">
                         {record.student_photo ? (
                           <img src={`data:image/jpeg;base64,${record.student_photo}`} alt="" className="h-full w-full object-cover" />
                         ) : (
                           <User className="h-5 w-5" />
                         )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                          {record.student_name}
                        </p>
                        <p className="text-xs text-slate-500">{format(new Date(record.timestamp), 'hh:mm:ss a')}</p>
                      </div>
                    </div>
                    <Badge variant={record.status === 'present' ? 'success' : 'warning'} className="capitalize">
                      {record.status}
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {recentMarks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <Clock className="h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400 italic">No attendance marked yet today.</p>
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-4 pt-0">
            <Button variant="ghost" className="w-full h-10 text-xs" onClick={() => window.location.href='/reports'}>
              View All Logs
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
