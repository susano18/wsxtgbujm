'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  className?: string;
}

export const CameraCapture = ({ onCapture, className }: CameraCaptureProps) => {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(true);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      setIsCapturing(false);
    }
  }, [webcamRef]);

  const reset = () => {
    setImgSrc(null);
    setIsCapturing(true);
  };

  const confirm = () => {
    if (imgSrc) {
      onCapture(imgSrc);
    }
  };

  return (
    <div className={cn('relative w-full aspect-video rounded-3xl overflow-hidden glass bg-slate-900', className)}>
      <AnimatePresence mode="wait">
        {isCapturing ? (
          <motion.div 
            key="webcam"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-full w-full"
          >
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user' }}
              className="h-full w-full object-cover"
            />
            {/* Overlay for face positioning */}
            <div className="absolute inset-0 border-[40px] border-black/40 flex items-center justify-center">
               <div className="w-64 h-80 border-2 border-dashed border-white/50 rounded-[100px] flex items-center justify-center">
                  <User className="h-20 w-20 text-white/20" />
               </div>
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4">
              <Button 
                onClick={capture} 
                className="h-16 w-16 rounded-full p-0 shadow-2xl hover:scale-110 active:scale-90 transition-transform"
                variant="primary"
              >
                <div className="h-10 w-10 rounded-full border-4 border-white/30 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-white" />
                </div>
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="preview"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-full w-full"
          >
            <img src={imgSrc!} alt="Capture" className="h-full w-full object-cover" />
            
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-6">
              <Button 
                onClick={reset} 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-14"
              >
                <X className="mr-2 h-5 w-5" /> Retake
              </Button>
              <Button 
                onClick={confirm} 
                variant="primary" 
                className="h-14 shadow-emerald-500/20 shadow-xl"
              >
                <Check className="mr-2 h-5 w-5" /> Confirm Photo
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
