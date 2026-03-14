import { cn } from '@/lib/utils';

interface SkeletonBlockProps {
  className?: string;
  lines?: number;
}

export const SkeletonBlock = ({ className, lines = 1 }: SkeletonBlockProps) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="skeleton-shimmer rounded-md h-4"
        style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('rounded-lg p-4 shadow-card space-y-3', className)}>
    <div className="skeleton-shimmer rounded-md h-4 w-1/3" />
    <div className="skeleton-shimmer rounded-md h-3 w-2/3" />
    <div className="skeleton-shimmer rounded-md h-3 w-1/2" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-2">
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="skeleton-shimmer rounded h-3 w-20" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className="grid gap-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, col) => (
          <div key={col} className="skeleton-shimmer rounded h-4" />
        ))}
      </div>
    ))}
  </div>
);
