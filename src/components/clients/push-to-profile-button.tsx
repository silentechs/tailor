'use client';

import { ArrowUpRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/fetch-api';

interface PushToProfileButtonProps {
    clientId: string;
    clientName: string;
    /** Local measurements recorded by tailor */
    measurements: Record<string, any> | null;
    /** Whether client has a linked user account */
    hasLinkedAccount: boolean;
    unit?: string;
    onPushComplete?: () => void;
}

export function PushToProfileButton({
    clientId,
    clientName,
    measurements,
    hasLinkedAccount,
    unit = 'CM',
    onPushComplete,
}: PushToProfileButtonProps) {
    const [pushing, setPushing] = useState(false);

    const hasMeasurements = measurements && Object.keys(measurements).length > 0;

    const handlePush = async () => {
        if (!measurements) return;

        try {
            setPushing(true);

            const res = await fetchApi(`/api/clients/${clientId}/push-to-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ values: measurements, unit }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to push measurements');
            }

            toast.success('Measurements Pushed', {
                description: `${clientName}'s profile has been updated with your measurements.`,
            });

            onPushComplete?.();
        } catch (error) {
            console.error('Push error:', error);
            toast.error('Push Failed', {
                description: error instanceof Error ? error.message : 'Could not update client profile.',
            });
        } finally {
            setPushing(false);
        }
    };

    // Don't show if no linked account or no measurements
    if (!hasLinkedAccount || !hasMeasurements) {
        return null;
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Push to Profile
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Push Measurements to Client Profile?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will update <strong>{clientName}'s</strong> global profile with your local
                        measurements. They will see these measurements in their Studio portal and can use them
                        with any tailor.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePush} disabled={pushing}>
                        {pushing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Push to Profile
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
