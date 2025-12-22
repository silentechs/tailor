'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  CheckCircle2,
  Lightbulb,
  Loader2,
  MessageSquare,
  HeartHandshake,
  AlertTriangle,
  Star,
  Send,
  X,
} from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInput } from '@/components/ui/voice-input';
import { cn } from '@/lib/utils';

// Categories with visual design
const FEEDBACK_CATEGORIES = [
  {
    value: 'BUG_REPORT',
    label: 'Bug Report',
    icon: Bug,
    description: 'Something isn\'t working correctly',
    color: 'text-red-500',
    bg: 'bg-red-50 hover:bg-red-100 border-red-200',
    activeBg: 'bg-red-100 border-red-500 ring-2 ring-red-200',
  },
  {
    value: 'FEATURE_REQUEST',
    label: 'Feature Request',
    icon: Lightbulb,
    description: 'Suggest a new feature or improvement',
    color: 'text-amber-500',
    bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
    activeBg: 'bg-amber-100 border-amber-500 ring-2 ring-amber-200',
  },
  {
    value: 'GENERAL_FEEDBACK',
    label: 'General Feedback',
    icon: MessageSquare,
    description: 'Share your thoughts with us',
    color: 'text-blue-500',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    activeBg: 'bg-blue-100 border-blue-500 ring-2 ring-blue-200',
  },
  {
    value: 'SUPPORT_REQUEST',
    label: 'Need Help',
    icon: HeartHandshake,
    description: 'Get assistance with the platform',
    color: 'text-purple-500',
    bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    activeBg: 'bg-purple-100 border-purple-500 ring-2 ring-purple-200',
  },
  {
    value: 'COMPLAINT',
    label: 'Complaint',
    icon: AlertTriangle,
    description: 'Report an issue or concern',
    color: 'text-orange-500',
    bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    activeBg: 'bg-orange-100 border-orange-500 ring-2 ring-orange-200',
  },
  {
    value: 'PRAISE',
    label: 'Praise',
    icon: Star,
    description: 'Let us know what you love',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    activeBg: 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-200',
  },
] as const;

// Form schema
const feedbackFormSchema = z.object({
  category: z.enum([
    'BUG_REPORT',
    'FEATURE_REQUEST',
    'GENERAL_FEEDBACK',
    'SUPPORT_REQUEST',
    'COMPLAINT',
    'PRAISE',
  ]),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  message: z.string().min(20, 'Please provide more detail (at least 20 characters)').max(5000),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional().or(z.literal('')),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

export function FeedbackDialog({ open, onOpenChange, user }: FeedbackDialogProps) {
  const [step, setStep] = React.useState<'category' | 'details' | 'success'>('category');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      category: undefined,
      subject: '',
      message: '',
      email: user?.email || '',
      name: user?.name || '',
    },
  });

  const selectedCategory = form.watch('category');
  const isAuthenticated = !!user?.id;

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        form.reset();
        setStep('category');
      }, 300);
    }
  }, [open, form]);

  const handleCategorySelect = (category: typeof FEEDBACK_CATEGORIES[number]['value']) => {
    form.setValue('category', category);
    setStep('details');
  };

  const onSubmit = async (values: FeedbackFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          pageUrl: typeof window !== 'undefined' ? window.location.href : null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit feedback');
      }

      setStep('success');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryInfo = FEEDBACK_CATEGORIES.find((c) => c.value === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 gap-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <AnimatePresence mode="wait">
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-8"
            >
              <DialogHeader className="mb-8">
                <DialogTitle className="text-2xl font-black font-heading tracking-tight">
                  Share Your <span className="text-primary italic">Feedback</span>
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  Your voice shapes the future of StitchCraft. What would you like to tell us?
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                {FEEDBACK_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => handleCategorySelect(category.value)}
                      className={cn(
                        'flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-left group',
                        category.bg
                      )}
                    >
                      <div
                        className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                          category.color,
                          'bg-white shadow-sm'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{category.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {category.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 'details' && categoryInfo && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Category Header */}
              <div
                className={cn(
                  'px-8 py-5 flex items-center gap-4 border-b',
                  categoryInfo.bg.split(' ')[0]
                )}
              >
                <button
                  type="button"
                  onClick={() => setStep('category')}
                  className="h-8 w-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                >
                  <X className="h-4 w-4 text-slate-600" />
                </button>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-xl flex items-center justify-center bg-white shadow-sm',
                      categoryInfo.color
                    )}
                  >
                    <categoryInfo.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{categoryInfo.label}</p>
                    <p className="text-xs text-slate-500">{categoryInfo.description}</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-5">
                  {/* Anonymous user fields */}
                  {!isAuthenticated && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                              Your Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Kwame Asante"
                                className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="kwame@example.com"
                                className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Subject
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief summary of your feedback"
                            className="h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Details
                          </FormLabel>
                          <VoiceInput
                            onTranscript={(text) => {
                              const current = form.getValues('message') || '';
                              form.setValue('message', current ? `${current} ${text}` : text);
                            }}
                            placeholder="Voice feedback..."
                          />
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide as much detail as possible..."
                            className="min-h-[140px] rounded-xl border-slate-200 focus:border-primary focus:ring-primary resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 rounded-xl font-bold"
                      onClick={() => setStep('category')}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Feedback
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="h-20 w-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center"
              >
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </motion.div>
              <h3 className="text-2xl font-black font-heading text-slate-900 mb-3">
                Thank You! 🎉
              </h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">
                Your feedback has been received. We truly appreciate you taking the time to help us
                improve StitchCraft Ghana.
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90"
              >
                Close
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

