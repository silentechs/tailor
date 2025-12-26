'use client';

import {
  Check,
  Copy,
  Facebook,
  Linkedin,
  Loader2,
  Mail,
  MessageCircle,
  Send,
  Share2,
  Twitter,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ShareButtonProps extends React.ComponentProps<typeof Button> {
  shareTitle?: string;
  shareText?: string;
  shareUrl?: string;
  /** Optional callback fired when share is successful. Useful for analytics. */
  onShare?: (platform: string) => void;
}

// Pinterest icon (not in lucide-react)
function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

export function ShareButton({
  shareTitle = 'Check this out!',
  shareText = 'I found this amazing design on StitchCraft!',
  shareUrl,
  onShare,
  className,
  variant = 'ghost',
  size = 'icon',
  children,
  ...props
}: ShareButtonProps) {
  const [url, setUrl] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);

  React.useEffect(() => {
    setUrl(shareUrl || window.location.href);
  }, [shareUrl]);

  const handleNativeShare = async () => {
    if (navigator.share) {
      setIsSharing(true);
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: url,
        });
        toast.success('Shared successfully!');
        onShare?.('native');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
          setIsOpen(true);
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      setIsOpen(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    onShare?.('clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlatformClick = (platformName: string) => {
    onShare?.(platformName.toLowerCase());
    setIsOpen(false);
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="h-5 w-5" />,
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`,
      color: 'bg-[#25D366] hover:bg-[#25D366]/90 text-white',
    },
    {
      name: 'Telegram',
      icon: <Send className="h-5 w-5" />,
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
      color: 'bg-[#0088cc] hover:bg-[#0088cc]/90 text-white',
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
      name: 'Pinterest',
      icon: <PinterestIcon className="h-5 w-5" />,
      href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(shareText)}`,
      color: 'bg-[#E60023] hover:bg-[#E60023]/90 text-white',
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
      href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`,
      color: 'bg-slate-600 hover:bg-slate-700 text-white',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant={variant}
        size={size}
        className={cn('rounded-full', className)}
        onClick={handleNativeShare}
        disabled={isSharing}
        {...props}
      >
        {isSharing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          children || <Share2 className="h-5 w-5" />
        )}
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this design</DialogTitle>
          <DialogDescription>Share via your favorite platform</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Social grid - responsive for 7 items */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-all hover:scale-105"
                onClick={() => handlePlatformClick(link.name)}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-11 h-11 rounded-full shadow-sm transition-transform',
                    link.color
                  )}
                >
                  {link.icon}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{link.name}</span>
              </a>
            ))}
          </div>

          {/* Copy link section */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="share-link" className="text-xs font-medium text-muted-foreground">
              Or copy link
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="share-link"
                value={url}
                readOnly
                className="h-10 text-sm bg-muted/50 font-mono text-xs"
              />
              <Button
                type="button"
                size="icon"
                onClick={copyToClipboard}
                className={cn(
                  'h-10 w-10 shrink-0 transition-all',
                  copied ? 'bg-green-500 hover:bg-green-600' : ''
                )}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

