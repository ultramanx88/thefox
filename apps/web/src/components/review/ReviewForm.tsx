'use client';

import { useState } from 'react';
import { useReviewStore, ReviewManager } from '@/lib/review/review-manager';

interface ReviewFormProps {
  orderId: string;
  restaurantId?: string;
  driverId?: string;
  onSubmit?: () => void;
}

export default function ReviewForm({ orderId, restaurantId, driverId, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const { addReview } = useReviewStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = ReviewManager.validateReview(rating, comment);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSubmitting(true);
    
    try {
      addReview({
        orderId,
        userId: 'current-user', // Get from auth context
        userName: 'ผู้ใช้งาน', // Get from auth context
        restaurantId,
        driverId,
        rating,
        comment,
        images: images.length > 0 ? images : undefined
      });
      
      setRating(0);
      setComment('');
      setImages([]);
      onSubmit?.();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการส่งรีวิว');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Simulate image upload
    const newImages = files.map((file, index) => `/uploads/review_${Date.now()}_${index}.jpg`);
    setImages([...images, ...newImages]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-xl font-semibold mb-6">เขียนรีวิว</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-3">ให้คะแนน</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className={`text-3xl transition-colors ${
                  star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ⭐
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-600">
              {rating > 0 && (
                <>
                  {rating} ดาว - {
                    rating === 5 ? 'ยอดเยี่ยม' :
                    rating === 4 ? 'ดีมาก' :
                    rating === 3 ? 'ดี' :
                    rating === 2 ? 'พอใช้' : 'ต้องปรับปรุง'
                  }
                </>
              )}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-2">ความคิดเห็น</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
            placeholder="แบ่งปันประสบการณ์ของคุณ..."
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            {comment.length}/500 ตัวอักษร (ขั้นต่ำ 10 ตัวอักษร)
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">รูปภาพ (ไม่บังคับ)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full border rounded-lg px-3 py-2"
          />
          {images.length > 0 && (
            <div className="flex gap-2 mt-2">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img src={image} alt={`Review ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || rating === 0 || comment.trim().length < 10}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {submitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิว'}
        </button>
      </form>
    </div>
  );
}