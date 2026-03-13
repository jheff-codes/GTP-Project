import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'gtp-card group cursor-default',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="micro-label flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-primary" />
          {title}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-bold px-2 py-1 rounded-full',
              trend.isPositive
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-3xl font-black tracking-tight text-foreground">
          {value}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
