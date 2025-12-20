
'use client';

import * as React from 'react';
import {
    Share2,
    Copy,
    Check,
    Twitter,
    Facebook,
    Linkedin,
    Mail,
    MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareButtonProps extends React.ComponentProps<typeof Button> {
    shareTitle?: string;
    shareText?: string;
    shareUrl?: string; // If not provided, uses window.location.href
}

export function ShareButton({
    shareTitle = 'Check this out!',
    shareText = 'I found this amazing design on StitchCraft!',
    shareUrl,
    className,
    variant = 'ghost',
    size = 'icon',
    children,
    ...props
}: ShareButtonProps) {
    const [url, setUrl] = React.useState('');
    const [copied, setCopied] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        // Set URL on client side
        setUrl(shareUrl || window.location.href);
    }, [shareUrl]);

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: url
                });
                toast.success('Shared successfully!');
            } catch (err) {
                // User cancelled or share failed
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                    setIsOpen(true); // Fallback to dialog
                }
            }
        } else {
            setIsOpen(true);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLinks = [
        {
            name: 'WhatsApp',
            icon: <MessageCircle className="h-5 w-5" />,
            href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + url)}`,
            color: 'bg-[#25D366] hover:bg-[#25D366]/90 text-white',
        },
        {
            name: 'Twitter',
            icon: <Twitter className="h-5 w-5" />,
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
            color: 'bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white',
        },
        {
            name: 'Facebook',
            icon: <Facebook className="h-5 w-5" />,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            color: 'bg-[#4267B2] hover:bg-[#4267B2]/90 text-white',
        },
        {
            name: 'LinkedIn',
            icon: <Linkedin className="h-5 w-5" />,
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            color: 'bg-[#0077b5] hover:bg-[#0077b5]/90 text-white',
        },
        {
            name: 'Email',
            icon: <Mail className="h-5 w-5" />,
            href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + ' ' + url)}`,
            color: 'bg-slate-600 hover:bg-slate-700 text-white',
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Button
                variant={variant}
                size={size}
                className={cn("rounded-full", className)}
                onClick={handleNativeShare}
                {...props}
            >
                {children || <Share2 className="h-5 w-5" />}
            </Button>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share this design</DialogTitle>
                    <DialogDescription>
                        Share this link via your favorite platform
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4">
                    <div className="grid grid-cols-5 gap-2">
                        {shareLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-2 rounded-lg transition-all hover:scale-105",
                                    "text-xs font-medium text-slate-600"
                                )}
                                onClick={() => setIsOpen(false)}
                            >
                                <div className={cn("flex items-center justify-center w-12 h-12 rounded-full shadow-sm", link.color)}>
                                    {link.icon}
                                </div>
                                {link.name}
                            </a>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="link" className="sr-only">Link</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="link"
                                defaultValue={url}
                                readOnly
                                className="h-10 text-sm bg-slate-50"
                            />
                            <Button
                                type="button"
                                size="icon"
                                onClick={copyToClipboard}
                                className={cn("h-10 w-10 shrink-0 transiton-all", copied ? "bg-green-500 hover:bg-green-600" : "")}
                            >
                                {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
                                <span className="sr-only">Copy</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
