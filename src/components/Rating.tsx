import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  rating: number;
  reviewCount: number;
  className?: string;
}

export function Rating({ rating, reviewCount, className }: RatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              i < Math.floor(rating)
                ? 'text-accent fill-accent'
                : 'text-muted-foreground/50'
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">({reviewCount})</span>
    </div>
  );
}
