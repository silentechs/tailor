'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, Menu, Scissors, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface UserInfo {
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth state on mount
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const navLinks = [
    { name: 'Features', href: '/#features' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Find a Designer', href: '/discover' },
    { name: 'Client Portal', href: '/auth/register?role=client' },
  ];

  const getDashboardLink = () => {
    if (!user) return '/auth/login';
    if (user.role === 'CLIENT') return '/studio';
    return '/dashboard';
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <img src="/icon.png" alt="StitchCraft Logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-xl font-bold font-heading tracking-tight">
            Stitch<span className="text-primary">Craft</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks
            .filter((link) => !(user && link.name === 'Client Portal'))
            .map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md hidden sm:block" />
          ) : user ? (
            <Button asChild variant="outline" className="hidden sm:flex gap-2 items-center">
              <Link href={getDashboardLink()}>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.profileImage || ''} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[100px] truncate">
                  {user.role === 'CLIENT' ? 'My Studio' : user.name?.split(' ')[0] || 'Dashboard'}
                </span>
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="hidden sm:flex">
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <span className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </span>
              <div className="flex flex-col gap-8 py-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-primary p-1.5 rounded-lg">
                    <Scissors className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold font-heading tracking-tight">StitchCraft</span>
                </div>

                {user && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImage || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {navLinks
                    .filter((link) => !(user && link.name === 'Client Portal'))
                    .map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium hover:text-primary transition-colors py-2 border-b border-border/50"
                      >
                        {link.name}
                      </Link>
                    ))}
                </div>
                <div className="flex flex-col gap-4 pt-4">
                  {user ? (
                    <Button asChild className="w-full h-12 rounded-xl">
                      <Link href={getDashboardLink()} onClick={() => setOpen(false)}>
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Go to {user.role === 'CLIENT' ? 'Studio' : 'Dashboard'}
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" asChild className="w-full h-12 rounded-xl">
                        <Link href="/auth/login" onClick={() => setOpen(false)}>
                          Login
                        </Link>
                      </Button>
                      <Button asChild className="w-full h-12 rounded-xl">
                        <Link href="/auth/register" onClick={() => setOpen(false)}>
                          Get Started
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}

