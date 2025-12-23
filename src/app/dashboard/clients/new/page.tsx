'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInput } from '@/components/ui/voice-input';
import { fetchApi } from '@/lib/fetch-api';
import { GHANA_REGIONS, isValidGhanaPhone } from '@/lib/utils';

const phoneRegex = /^(?:\+233|0)[235][0-9]{8}$/;

const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(phoneRegex, 'Invalid Ghana phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gender: z.string().optional(),
  address: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

type MatchedUser = {
  id: string;
  name: string;
  email: string | null;
  profileImage: string | null;
};

export default function NewClientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      gender: '',
      address: '',
      region: '',
      city: '',
      notes: '',
    },
  });

  // Watch phone field for changes
  const watchedPhone = useWatch({ control: form.control, name: 'phone' });

  // Debounced phone lookup
  const lookupPhone = useCallback(async (phone: string) => {
    if (!isValidGhanaPhone(phone)) {
      setMatchedUser(null);
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await fetchApi('/api/clients/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.found && data.user) {
        setMatchedUser(data.user);
        // Auto-fill name and email from matched user
        if (data.user.name && !form.getValues('name')) {
          form.setValue('name', data.user.name);
        }
        if (data.user.email && !form.getValues('email')) {
          form.setValue('email', data.user.email);
        }
      } else {
        setMatchedUser(null);
      }
    } catch {
      setMatchedUser(null);
    } finally {
      setIsLookingUp(false);
    }
  }, [form]);

  // Debounce phone lookup
  useEffect(() => {
    if (!watchedPhone || watchedPhone.length < 10) {
      setMatchedUser(null);
      return;
    }

    const timer = setTimeout(() => {
      lookupPhone(watchedPhone);
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedPhone, lookupPhone]);

  async function onSubmit(values: z.infer<typeof clientSchema>) {
    setIsSubmitting(true);
    try {
      // Convert empty strings to null/undefined for optional fields
      const payload = {
        ...values,
        email: values.email || undefined,
        gender: values.gender || undefined,
        address: values.address || undefined,
        region: values.region || undefined,
        city: values.city || undefined,
        notes: values.notes || undefined,
      };

      const response = await fetchApi('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client');
      }

      if (matchedUser) {
        toast.success('Client Linked!', {
          description: `${data.data.name} has been linked to their StitchCraft account.`,
        });
      } else {
        toast.success('Client Added', {
          description: `${data.data.name} has been added to your directory.`,
        });
      }

      router.push('/dashboard/clients');
    } catch (error: any) {
      console.error(error);
      toast.error('Error', {
        description: error.message || 'Something went wrong.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-heading text-primary">Add Client</h1>
        <p className="text-muted-foreground">Add a new client to your directory.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone-based user detection banner */}
              {matchedUser && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Existing StitchCraft Account Found!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                      <span className="font-semibold">{matchedUser.name}</span>
                      {matchedUser.email && ` • ${matchedUser.email}`}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      This client already has an account. Their profile, measurements, and designs will be automatically linked.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="024xxxxxxx" {...field} />
                          {isLookingUp && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Ghanaian number (+233 or 02...)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Ama Osei" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="ama@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address / Landmark</FormLabel>
                    <FormControl>
                      <Input placeholder="House No. 123, East Legon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(GHANA_REGIONS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City / Town</FormLabel>
                      <FormControl>
                        <Input placeholder="Accra" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Additional Notes</FormLabel>
                      <VoiceInput
                        onTranscript={(text) => {
                          const current = form.getValues('notes') || '';
                          form.setValue('notes', current ? `${current} ${text}` : text);
                        }}
                        placeholder="Describe preferences..."
                      />
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific preferences or details..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : matchedUser ? (
                'Link & Add Client'
              ) : (
                'Add Client'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
