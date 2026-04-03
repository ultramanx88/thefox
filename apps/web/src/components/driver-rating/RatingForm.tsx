'use client';

import { useState } from 'react';
import { driverRatingManager } from '@/lib/driver-rating/rating-manager';

interface RatingFormProps {
  orderId: string;
  driverId: string;
  driverName: string;
  onSubmit?: () => void;
}

export default function RatingForm({ orderId, driverId, driverName, onSubmit }: RatingFormProps) {
  const [rating, setRating] = useState(5);
  const [criteria, setCriteria] = useState({
    speed: 5,
    politeness: 5,
    foodCondition: 5,
    communication: 5
  });
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    driverRatingManager.addRating({
      driverId,
      orderId,
      customerId: 'customer_001',
      rating,
      criteria,
      comment: comment.trim() || undefined
    });

    setIsSubmitted(true);
    onSubmit?.();
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium w-24">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className={`text-2xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ⭐
          </button>
        ))}
      </div>
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h2 className="text-xl font-bold text-green-600 mb-2">ขอบคุณสำหรับการให้คะแนน!</h2>
        <p className="text-gray-600">ความคิดเห็นของคุณช่วยให้เราปรับปรุงบริการได้ดีขึ้น</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">ให้คะแนนคนส่ง</h2>
      <p className="text-gray-600 mb-6">คนส่ง: {driverName}</p>

      {/* Overall Rating */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">คะแนนรวม</h3>
        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-4xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ⭐
            </button>
          ))}
        </div>
        <p className="text-center text-gray-600">{rating}/5 ดาว</p>
      </div>

      {/* Detailed Criteria */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">ประเมินรายละเอียด</h3>
        <StarRating 
          value={criteria.speed} 
          onChange={(v) => setCriteria({...criteria, speed: v})}
          label="ความเร็ว"
        />
        <StarRating 
          value={criteria.politeness} 
          onChange={(v) => setCriteria({...criteria, politeness: v})}
          label="มารยาท"
        />
        <StarRating 
          value={criteria.foodCondition} 
          onChange={(v) => setCriteria({...criteria, foodCondition: v})}
          label="สภาพอาหาร"
        />
        <StarRating 
          value={criteria.communication} 
          onChange={(v) => setCriteria({...criteria, communication: v})}
          label="การสื่อสาร"
        />
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="block font-semibold mb-2">ความคิดเห็นเพิ่มเติม (ไม่บังคับ)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 border rounded-lg"
          rows={3}
          placeholder="แบ่งปันประสบการณ์ของคุณ..."
        />
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-medium"
      >
        ส่งคะแนน
      </button>
    </div>
  );
}