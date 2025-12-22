'use client';

import { Mic } from 'lucide-react';
import { Button } from './button';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  placeholder?: string;
}

export function VoiceInput({
  onTranscript,
  className,
  size = 'icon-sm',
  variant = 'ghost',
  placeholder = 'Listening...',
}: VoiceInputProps) {
  const { isListening, isSupported, toggleListening, transcript } = useSpeechRecognition({
    onResult: (text, isFinal) => {
      if (isFinal) {
        onTranscript(text);
      }
    },
    onError: (error) => {
      if (error === 'not-allowed') {
        toast.error('Microphone access denied', {
          description: 'Please enable microphone access in your browser settings.',
        });
      } else {
        toast.error('Speech recognition error', {
          description: error,
        });
      }
    },
  });

  if (!isSupported) return null;

  return (
    <div className={cn('relative flex items-center', className)}>
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 10 }}
            className="absolute right-full mr-2 whitespace-nowrap bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-2"
          >
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            {transcript || placeholder}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        type="button"
        variant={isListening ? 'default' : variant}
        size={size}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleListening();
        }}
        className={cn(
          'rounded-full transition-all duration-300',
          isListening && 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-100 dark:ring-red-900/20'
        )}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <Mic className="h-4 w-4 animate-bounce" />
        ) : (
          <Mic className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </Button>
    </div>
  );
}

