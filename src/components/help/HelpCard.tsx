'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HelpCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color?: 'primary' | 'gold' | 'red' | 'blue';
  className?: string;
}

export function HelpCard({
  title,
  description,
  icon: Icon,
  href,
  color = 'primary',
  className,
}: HelpCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20 hover:border-primary/40',
    gold: 'bg-ghana-gold/10 text-ghana-gold border-ghana-gold/20 hover:border-ghana-gold/40',
    red: 'bg-ghana-red/10 text-ghana-red border-ghana-red/20 hover:border-ghana-red/40',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:border-blue-500/40',
  };

  const iconColorClasses = {
    primary: 'bg-primary text-white',
    gold: 'bg-ghana-gold text-white',
    red: 'bg-ghana-red text-white',
    blue: 'bg-blue-500 text-white',
  };

  return (
    <Link href={href}>
      <Card
        className={cn(
          'group transition-all duration-300 hover:shadow-lg border-2 h-full',
          colorClasses[color],
          className
        )}
      >
        <CardHeader className="space-y-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm',
              iconColorClasses[color]
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="font-heading text-xl group-hover:underline underline-offset-4 decoration-2">
              {title}
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium line-clamp-2">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
