'use client';

import { useState } from 'react';
import { useReviewStore, ReviewManager } from '@/lib/review/review-manager';

interface ReviewListProps {
  targetId: string;
  type: 'restaurant' | 'driver';
  showStats?: boolean;
}

export default function ReviewList({ targetId, type, showStats = true }: ReviewListProps) {
  const { getReviewsByTarget, getReviewStats, markHelpful, addResponse } = useReviewStore();
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showResponseForm, setShowResponseForm] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const reviews = getReviewsByTarget(targetId, type);
  const stats = getReviewStats(targetId, type);

  const filteredAndSortedReviews = reviews
    .filter(review => filterRating === null || review.rating === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return b.createdAt.getTime() - a.createdAt.getTime();
        case 'oldest': return a.createdAt.getTime() - b.createdAt.getTime();
        case 'highest': return b.rating - a.rating;
        case 'lowest': return a.rating - b.rating;
        default: return 0;
      }
    });

  const handleResponse = (reviewId: string) => {
    if (responseText.trim()) {
      addResponse(reviewId, responseText, 'current-user');
      setResponseText('');
      setShowResponseForm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {showStats && stats.totalReviews > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="text-2xl">{ReviewManager.getRatingStars(stats.averageRating)}</div>
                  <div className="text-sm text-gray-600">{stats.totalReviews} รีวิว</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rating} ⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${stats.totalReviews > 0 ? ((stats.ratingDistribution[rating] || 0) / stats.totalReviews) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {stats.ratingDistribution[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium mr-2">เรียงตาม:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="newest">ใหม่ล่าสุด</option>
              <option value="oldest">เก่าสุด</option>
              <option value="highest">คะแนนสูงสุด</option>
              <option value="lowest">คะแนนต่ำสุด</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium mr-2">กรองคะแนน:</label>
            <select
              value={filterRating || ''}
              onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="">ทั้งหมด</option>
              <option value="5">5 ดาว</option>
              <option value="4">4 ดาว</option>
              <option value="3">3 ดาว</option>
              <option value="2">2 ดาว</option>
              <option value="1">1 ดาว</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {filteredAndSortedReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีรีวิว</h3>
            <p className="text-gray-600">เป็นคนแรกที่เขียนรีวิว</p>
          </div>
        ) : (
          filteredAndSortedReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {review.userAvatar ? (
                    <img src={review.userAvatar} alt={review.userName} className="w-12 h-12 rounded-full" />
                  ) : (
                    <span className="text-gray-600">👤</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{review.userName}</h4>
                      <div className="flex items-center gap-2">
                        <div className="text-yellow-400">{ReviewManager.getRatingStars(review.rating)}</div>
                        <span className="text-sm text-gray-600">
                          {ReviewManager.formatTimeAgo(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{review.comment}</p>
                  
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    <button
                      onClick={() => markHelpful(review.id)}
                      className="text-gray-600 hover:text-blue-600 flex items-center gap-1"
                    >
                      👍 มีประโยชน์ ({review.helpful})
                    </button>
                    
                    {type === 'restaurant' && !review.response && (
                      <button
                        onClick={() => setShowResponseForm(review.id)}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        ตอบกลับ
                      </button>
                    )}
                  </div>
                  
                  {/* Response */}
                  {review.response && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">ตอบกลับจากร้าน</span>
                        <span className="text-xs text-gray-500">
                          {ReviewManager.formatTimeAgo(review.response.respondedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{review.response.text}</p>
                    </div>
                  )}
                  
                  {/* Response Form */}
                  {showResponseForm === review.id && (
                    <div className="mt-4 p-4 border rounded-lg">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm h-20 resize-none"
                        placeholder="เขียนตอบกลับ..."
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleResponse(review.id)}
                          className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          ส่ง
                        </button>
                        <button
                          onClick={() => setShowResponseForm(null)}
                          className="border px-4 py-1 rounded text-sm hover:bg-gray-50"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}