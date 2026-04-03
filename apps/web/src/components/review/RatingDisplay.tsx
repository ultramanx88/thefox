'use client';

import { useReviewStore, ReviewManager } from '@/lib/review/review-manager';

interface RatingDisplayProps {
  targetId: string;
  type: 'restaurant' | 'driver';
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export default function RatingDisplay({ targetId, type, size = 'md', showCount = true }: RatingDisplayProps) {
  const { getReviewStats } = useReviewStore();
  const stats = getReviewStats(targetId, type);

  if (stats.totalReviews === 0) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <span className={size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}>
          ⭐⭐⭐⭐⭐
        </span>
        <span className={`text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          ยังไม่มีรีวิว
        </span>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className={`${sizeClasses[size]} text-yellow-400`}>
          {ReviewManager.getRatingStars(stats.averageRating)}
        </span>
        <span className={`font-medium ${ReviewManager.getRatingColor(stats.averageRating)} ${textSizeClasses[size]}`}>
          {stats.averageRating.toFixed(1)}
        </span>
      </div>
      
      {showCount && (
        <span className={`text-gray-500 ${textSizeClasses[size]}`}>
          ({stats.totalReviews} รีวิว)
        </span>
      )}
    </div>
  );
}