'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export default function StudentLogin() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push(user.role === 'student' ? '/student/dashboard' : '/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !password) {
      toast.error('Please enter both student ID and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/student/login', { student_id: studentId, password });
      login(response.data.token, response.data.user);
      toast.success('Welcome back, student!');
      router.push('/student/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#020617] opacity-90" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8 space-y-2">
           <div className="inline-flex p-3 bg-secondary/10 rounded-2xl border border-secondary/20 mb-4">
              <GraduationCap className="h-8 w-8 text-secondary" />
           </div>
           <h1 className="text-3xl font-bold tracking-tight">Student Portal</h1>
           <p className="text-slate-500">Access your attendance records and profile</p>
        </div>

        <Card className="glass p-8 md:p-10">
          <CardContent className="p-0">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Student ID (e.g. STU123)"
                    className="pl-12 h-14 bg-white/30 dark:bg-slate-950/30"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
                <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                   <Input
                    type="password"
                    placeholder="Password"
                    className="pl-12 h-14 bg-white/30 dark:bg-slate-950/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold group"
                variant="primary"
                isLoading={isLoading}
              >
                Login
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="text-center">
                 <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="text-sm text-slate-500 hover:text-primary transition-colors"
                 >
                   Admin Access? Click here
                 </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
