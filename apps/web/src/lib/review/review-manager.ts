import { create } from 'zustand';

interface Review {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  restaurantId?: string;
  driverId?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
  helpful: number;
  response?: {
    text: string;
    respondedAt: Date;
    respondedBy: string;
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

interface ReviewState {
  reviews: Review[];
  userReviews: Review[];
  
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'helpful'>) => void;
  getReviewsByTarget: (targetId: string, type: 'restaurant' | 'driver') => Review[];
  getReviewStats: (targetId: string, type: 'restaurant' | 'driver') => ReviewStats;
  markHelpful: (reviewId: string) => void;
  addResponse: (reviewId: string, response: string, respondedBy: string) => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [
    {
      id: '1',
      orderId: 'ORD-001',
      userId: 'user1',
      userName: 'สมชาย ใจดี',
      userAvatar: '/avatars/user1.jpg',
      restaurantId: 'rest1',
      rating: 5,
      comment: 'อาหารอร่อยมาก บริการดีเยี่ยม จัดส่งรวดเร็ว',
      images: ['/reviews/food1.jpg'],
      createdAt: new Date('2024-01-15T19:30:00'),
      helpful: 12
    },
    {
      id: '2',
      orderId: 'ORD-002',
      userId: 'user2',
      userName: 'สมหญิง รักดี',
      driverId: 'driver1',
      rating: 4,
      comment: 'คนขับสุภาพ ส่งตรงเวลา อาหารยังร้อนอยู่',
      createdAt: new Date('2024-01-14T18:15:00'),
      helpful: 8,
      response: {
        text: 'ขอบคุณครับ จะพยายามให้บริการที่ดีต่อไป',
        respondedAt: new Date('2024-01-14T20:00:00'),
        respondedBy: 'driver1'
      }
    }
  ],
  userReviews: [],

  addReview: (reviewData) => {
    const newReview: Review = {
      ...reviewData,
      id: Date.now().toString(),
      createdAt: new Date(),
      helpful: 0
    };

    set((state) => ({
      reviews: [newReview, ...state.reviews],
      userReviews: [newReview, ...state.userReviews]
    }));
  },

  getReviewsByTarget: (targetId, type) => {
    const state = get();
    return state.reviews.filter(review => 
      type === 'restaurant' ? review.restaurantId === targetId : review.driverId === targetId
    );
  },

  getReviewStats: (targetId, type) => {
    const reviews = get().getReviewsByTarget(targetId, type);
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating] = (dist[review.rating] || 0) + 1;
      return dist;
    }, {} as { [key: number]: number });

    return { totalReviews, averageRating, ratingDistribution };
  },

  markHelpful: (reviewId) => {
    set((state) => ({
      reviews: state.reviews.map(review =>
        review.id === reviewId ? { ...review, helpful: review.helpful + 1 } : review
      )
    }));
  },

  addResponse: (reviewId, responseText, respondedBy) => {
    set((state) => ({
      reviews: state.reviews.map(review =>
        review.id === reviewId
          ? {
              ...review,
              response: {
                text: responseText,
                respondedAt: new Date(),
                respondedBy
              }
            }
          : review
      )
    }));
  }
}));

export class ReviewManager {
  static getRatingStars(rating: number): string {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '⭐' : '');
  }

  static getRatingColor(rating: number): string {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  }

  static formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'เมื่อสักครู่';
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH');
  }

  static validateReview(rating: number, comment: string): { valid: boolean; error?: string } {
    if (rating < 1 || rating > 5) {
      return { valid: false, error: 'กรุณาให้คะแนน 1-5 ดาว' };
    }
    if (comment.trim().length < 10) {
      return { valid: false, error: 'กรุณาเขียนรีวิวอย่างน้อย 10 ตัวอักษร' };
    }
    return { valid: true };
  }
}