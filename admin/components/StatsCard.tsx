import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  trend?: { value: number; positive: boolean };
}

export function StatsCard({ title, value, subtitle, icon: Icon, color = 'text-primary', trend }: StatsCardProps) {
  return (
    <div className="bg-surface border border-[rgba(255,107,0,0.1)] rounded-xl p-5 hover:border-[rgba(255,107,0,0.3)] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${color.replace('text-', 'bg-')}/20 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.positive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-sm mb-1">{title}</p>
      <p className="text-white text-2xl font-black">{value}</p>
      {subtitle && <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>}
    </div>
  );
}
