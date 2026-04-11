'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter both username and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      login(response.data.token, response.data.user);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] rounded-full bg-accent/10 blur-[100px] animate-bounce" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#020617] opacity-90" />
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl w-full mx-auto relative z-10">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col space-y-8"
        >
          <div className="flex items-center space-x-3">
             <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 backdrop-blur-sm">
                <Camera className="h-8 w-8 text-primary" />
             </div>
             <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">SmartAtt</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Next-Gen <br /> 
              <span className="text-gradient">Attendance</span> <br /> 
              Simplified.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              Experience the power of AI-driven face recognition. Secure, instant, and incredibly smart attendance management for modern labs.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800">
               <ShieldCheck className="h-5 w-5 text-success" />
               <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Biometric Secure</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800">
               <Sparkles className="h-5 w-5 text-warning" />
               <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Real-time Sync</span>
            </div>
          </div>
        </motion.div>

        {/* Login Form card */}
        <motion.div
           initial={{ opacity: 0, x: 50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <Card className="glass p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
            
            <CardHeader className="text-center p-0 mb-8">
              <CardTitle className="text-3xl">Admin Login</CardTitle>
              <CardDescription>Enter your credentials to access the console</CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      placeholder="Username" 
                      className="pl-12 h-14 bg-white/30 dark:bg-slate-950/30"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
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
                  isLoading={isLoggingIn}
                >
                  Get Started 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                    <span className="text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-primary font-medium hover:underline">Forgot Password?</a>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <p className="text-center mt-8 text-slate-500 text-sm">
            © 2026 Smart Attendance Inc. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
