'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  BookOpen, 
  Camera as CameraIcon, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Upload
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

const steps = [
  { title: 'Personal', icon: User },
  { title: 'Academic', icon: BookOpen },
  { title: 'Biometrics', icon: CameraIcon },
  { title: 'Finish', icon: CheckCircle },
];

export default function StudentRegistration() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    email: '',
    department: '',
    year: '',
    photo: null as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCapture = async (imageSrc: string) => {
    setFormData((prev) => ({ ...prev, photo: imageSrc }));
    await handleSubmit(imageSrc);
  };

  const handleSubmit = async (photoBase64: string) => {
    setIsSubmitting(true);
    try {
      // Create FormData for multipart upload
      const data = new FormData();
      data.append('name', formData.name);
      data.append('student_id', formData.student_id);
      data.append('email', formData.email);
      data.append('department', formData.department);
      data.append('year', formData.year);

      if (photoBase64) {
        // Convert base64 to blob
        const fetchRes = await fetch(photoBase64);
        const blob = await fetchRes.blob();
        data.append('photo', blob, `${formData.student_id}.jpg`);
      }

      await api.post('/students', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setCurrentStep(3); // Success step
      toast.success('Student registered successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to register student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Student Enrollment</h1>
        <p className="text-slate-500 max-w-lg">Complete the multi-step process to register a new student and enroll their biometric data.</p>
      </div>

      {/* Progress Indicator */}
      <div className="relative flex justify-between max-w-2xl mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 -z-10" />
        <motion.div 
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 -z-10"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center space-y-2">
            <motion.div
              animate={{
                backgroundColor: idx <= currentStep ? 'var(--color-primary)' : 'var(--background)',
                color: idx <= currentStep ? '#fff' : '#94a3b8',
                borderColor: idx <= currentStep ? 'var(--color-primary)' : 'border-slate-200',
              }}
              className={cn(
                'h-12 w-12 rounded-full border-4 flex items-center justify-center transition-colors shadow-sm bg-white dark:bg-slate-950',
              )}
            >
              <step.icon className="h-5 w-5" />
            </motion.div>
            <span className={cn('text-xs font-bold uppercase tracking-wider', idx <= currentStep ? 'text-primary' : 'text-slate-400')}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card className="glass min-h-[500px] flex flex-col p-8 md:p-12">
        <div className="flex justify-end mb-6">
           <Button variant="outline" size="sm" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv';
              input.onchange = async (e: any) => {
                 const file = e.target.files[0];
                 if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                       toast.loading('Importing students...');
                       const res = await api.post('/students/bulk', formData);
                       toast.dismiss();
                       toast.success(res.data.message);
                    } catch (err: any) {
                       toast.dismiss();
                       toast.error(err.response?.data?.error || 'Bulk import failed');
                    }
                 }
              };
              input.click();
           }}>
              <Upload className="mr-2 h-4 w-4" /> Bulk Import (CSV)
           </Button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col"
          >
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Input 
                    label="Full Name" 
                    placeholder="Enter student's full name" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                  <Input 
                    label="Student ID" 
                    placeholder="e.g. STU12345" 
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                  />
                </div>
                <Input 
                  label="Email Address" 
                  placeholder="student@university.com" 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <div className="pt-8">
                  <Button onClick={nextStep} className="ml-auto w-full md:w-fit px-12 h-14" disabled={!formData.name || !formData.student_id}>
                    Next Step <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                   <Input 
                    label="Department" 
                    placeholder="e.g. Computer Science" 
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                  <Input 
                    label="Year of Study" 
                    placeholder="e.g. Junior, 3rd Year" 
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="pt-8 flex justify-between">
                  <Button variant="ghost" onClick={prevStep} className="h-14">
                    <ArrowLeft className="mr-2 h-5 w-5" /> Back
                  </Button>
                  <Button onClick={nextStep} className="px-12 h-14" disabled={!formData.department}>
                    Next Step <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 flex flex-col items-center">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold">Face Enrollment</h3>
                  <p className="text-slate-500 text-sm">Position your face within the frame and look directly at the camera.</p>
                </div>
                <CameraCapture onCapture={handleCapture} className="max-w-xl mx-auto" />
                <div className="pt-4 flex w-full justify-start">
                   <Button variant="ghost" onClick={prevStep} className="h-14">
                    <ArrowLeft className="mr-2 h-5 w-5" /> Back
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="h-24 w-24 rounded-full bg-success/20 flex items-center justify-center text-success">
                   <CheckCircle className="h-16 w-16" />
                </div>
                <div className="space-y-2">
                   <h2 className="text-3xl font-bold">Identity Verified!</h2>
                   <p className="text-slate-500 max-w-sm">All data has been successfully processed and synchronized with the security nodes.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-md pt-8">
                   <Button variant="outline" className="h-14" onClick={() => {
                     setFormData({ name: '', student_id: '', email: '', department: '', year: '', photo: null });
                     setCurrentStep(0);
                   }}>
                     Register New
                   </Button>
                   <Button className="h-14" onClick={() => window.location.href='/dashboard'}>
                     Go Home
                   </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
      
      {/* Action footer for pre-final steps */}
      {currentStep < 2 && currentStep > 0 && (
         <div className="bg-primary/5 p-4 rounded-2xl flex items-center space-x-4 border border-primary/10">
            <div className="p-2 bg-primary/20 rounded-xl">
               <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
            <p className="text-sm text-primary-dark font-medium">Validating student record with local databases...</p>
         </div>
      )}
    </div>
  );
}
