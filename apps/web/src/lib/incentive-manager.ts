import { create } from 'zustand';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'delivery' | 'rating' | 'streak' | 'earnings' | 'special';
  target: number;
  current: number;
  reward: number;
  isCompleted: boolean;
  completedAt?: Date;
}

interface Bonus {
  id: string;
  type: 'peak_hour' | 'weather' | 'distance' | 'rating' | 'streak' | 'achievement';
  amount: number;
  multiplier?: number;
  description: string;
  orderId?: string;
  earnedAt: Date;
}

interface IncentiveState {
  achievements: Achievement[];
  bonuses: Bonus[];
  currentStreak: number;
  totalBonusEarned: number;
  
  // Actions
  checkAchievements: (deliveries: number, rating: number, earnings: number) => void;
  addBonus: (bonus: Omit<Bonus, 'id' | 'earnedAt'>) => void;
  calculatePeakHourBonus: (hour: number, baseAmount: number) => number;
  calculateWeatherBonus: (weather: string, baseAmount: number) => number;
  updateStreak: (isSuccessful: boolean) => void;
}

export const useIncentiveStore = create<IncentiveState>((set, get) => ({
  achievements: [
    {
      id: '1',
      title: 'นักส่งมือใหม่',
      description: 'ส่งอาหารครบ 10 ออเดอร์',
      icon: '🚀',
      type: 'delivery',
      target: 10,
      current: 8,
      reward: 100,
      isCompleted: false
    },
    {
      id: '2',
      title: 'ดาวห้าดวง',
      description: 'รักษาเรตติ้ง 4.8+ เป็นเวลา 30 วัน',
      icon: '⭐',
      type: 'rating',
      target: 30,
      current: 15,
      reward: 500,
      isCompleted: false
    },
    {
      id: '3',
      title: 'นักวิ่งมาราธอน',
      description: 'ส่งอาหารติดต่อกัน 7 วัน',
      icon: '🏃',
      type: 'streak',
      target: 7,
      current: 3,
      reward: 200,
      isCompleted: false
    }
  ],
  bonuses: [
    {
      id: '1',
      type: 'peak_hour',
      amount: 25,
      description: 'โบนัสช่วงเวลาเร่งด่วน (18:00-20:00)',
      orderId: 'ORD-001',
      earnedAt: new Date('2024-01-15T19:30:00')
    },
    {
      id: '2',
      type: 'weather',
      amount: 15,
      description: 'โบนัสฝนตก',
      orderId: 'ORD-002',
      earnedAt: new Date('2024-01-15T14:15:00')
    }
  ],
  currentStreak: 3,
  totalBonusEarned: 1250,

  checkAchievements: (deliveries, rating, earnings) => {
    set((state) => ({
      achievements: state.achievements.map(achievement => {
        if (achievement.isCompleted) return achievement;

        let newCurrent = achievement.current;
        
        switch (achievement.type) {
          case 'delivery':
            newCurrent = deliveries;
            break;
          case 'rating':
            newCurrent = rating >= 4.8 ? achievement.current + 1 : 0;
            break;
          case 'earnings':
            newCurrent = earnings;
            break;
          case 'streak':
            newCurrent = state.currentStreak;
            break;
        }

        const isCompleted = newCurrent >= achievement.target;
        
        return {
          ...achievement,
          current: newCurrent,
          isCompleted,
          completedAt: isCompleted && !achievement.isCompleted ? new Date() : achievement.completedAt
        };
      })
    }));
  },

  addBonus: (bonus) => {
    const newBonus: Bonus = {
      ...bonus,
      id: Date.now().toString(),
      earnedAt: new Date()
    };

    set((state) => ({
      bonuses: [newBonus, ...state.bonuses],
      totalBonusEarned: state.totalBonusEarned + bonus.amount
    }));
  },

  calculatePeakHourBonus: (hour, baseAmount) => {
    const peakHours = [
      { start: 11, end: 14, multiplier: 1.2 }, // Lunch
      { start: 17, end: 21, multiplier: 1.5 }  // Dinner
    ];

    for (const peak of peakHours) {
      if (hour >= peak.start && hour < peak.end) {
        return baseAmount * (peak.multiplier - 1);
      }
    }
    return 0;
  },

  calculateWeatherBonus: (weather, baseAmount) => {
    const weatherMultipliers = {
      'rain': 1.3,
      'storm': 1.5,
      'heavy_rain': 1.4
    };
    
    const multiplier = weatherMultipliers[weather as keyof typeof weatherMultipliers] || 1;
    return multiplier > 1 ? baseAmount * (multiplier - 1) : 0;
  },

  updateStreak: (isSuccessful) => {
    set((state) => ({
      currentStreak: isSuccessful ? state.currentStreak + 1 : 0
    }));
  }
}));

export class IncentiveManager {
  static processOrderCompletion(orderId: string, baseAmount: number, rating: number) {
    const store = useIncentiveStore.getState();
    const now = new Date();
    const hour = now.getHours();
    
    // Peak hour bonus
    const peakBonus = store.calculatePeakHourBonus(hour, baseAmount);
    if (peakBonus > 0) {
      store.addBonus({
        type: 'peak_hour',
        amount: peakBonus,
        description: `โบนัสช่วงเวลาเร่งด่วน (${hour}:00)`,
        orderId
      });
    }

    // Rating bonus
    if (rating >= 5) {
      store.addBonus({
        type: 'rating',
        amount: 20,
        description: 'โบนัสคะแนนเต็ม 5 ดาว',
        orderId
      });
    }

    // Distance bonus (mock calculation)
    const distance = Math.random() * 10 + 1;
    if (distance > 5) {
      store.addBonus({
        type: 'distance',
        amount: Math.floor(distance * 2),
        description: `โบนัสระยะทางไกล (${distance.toFixed(1)} กม.)`,
        orderId
      });
    }

    store.updateStreak(rating >= 4);
  }

  static getBonusIcon(type: Bonus['type']) {
    const icons = {
      peak_hour: '🔥',
      weather: '🌧️',
      distance: '🛣️',
      rating: '⭐',
      streak: '🏃',
      achievement: '🏆'
    };
    return icons[type] || '💰';
  }

  static getAchievementProgress(current: number, target: number) {
    return Math.min((current / target) * 100, 100);
  }
}