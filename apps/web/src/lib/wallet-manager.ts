import { create } from 'zustand';

interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'bonus' | 'penalty' | 'refund';
  amount: number;
  description: string;
  orderId?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  bankAccount: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: Date;
  processedAt?: Date;
  reason?: string;
}

interface WalletState {
  balance: number;
  totalEarnings: number;
  pendingWithdrawals: number;
  transactions: Transaction[];
  withdrawalRequests: WithdrawalRequest[];
  dailyEarnings: { date: string; amount: number }[];
  
  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  requestWithdrawal: (amount: number, bankAccount: string) => void;
  updateWithdrawalStatus: (id: string, status: WithdrawalRequest['status'], reason?: string) => void;
  getEarningsStats: () => {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: 2450.75,
  totalEarnings: 15680.50,
  pendingWithdrawals: 500.00,
  transactions: [
    {
      id: '1',
      type: 'earning',
      amount: 85.50,
      description: 'Order #ORD-2024-001 delivery',
      orderId: 'ORD-2024-001',
      status: 'completed',
      createdAt: new Date('2024-01-15T14:30:00')
    },
    {
      id: '2',
      type: 'bonus',
      amount: 50.00,
      description: 'Peak hour bonus',
      status: 'completed',
      createdAt: new Date('2024-01-15T12:00:00')
    },
    {
      id: '3',
      type: 'withdrawal',
      amount: -1000.00,
      description: 'Withdrawal to Bangkok Bank ***1234',
      status: 'completed',
      createdAt: new Date('2024-01-14T10:15:00')
    }
  ],
  withdrawalRequests: [
    {
      id: '1',
      amount: 500.00,
      bankAccount: 'Bangkok Bank ***1234',
      status: 'pending',
      requestedAt: new Date('2024-01-15T16:00:00')
    }
  ],
  dailyEarnings: [
    { date: '2024-01-15', amount: 285.50 },
    { date: '2024-01-14', amount: 320.75 },
    { date: '2024-01-13', amount: 195.25 },
    { date: '2024-01-12', amount: 410.00 },
    { date: '2024-01-11', amount: 275.80 }
  ],

  addTransaction: (transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    set((state) => {
      const newBalance = state.balance + transaction.amount;
      const newTotalEarnings = transaction.type === 'earning' || transaction.type === 'bonus' 
        ? state.totalEarnings + Math.abs(transaction.amount)
        : state.totalEarnings;

      return {
        transactions: [newTransaction, ...state.transactions],
        balance: newBalance,
        totalEarnings: newTotalEarnings
      };
    });
  },

  requestWithdrawal: (amount, bankAccount) => {
    const state = get();
    const MIN_WITHDRAWAL = 100;
    
    if (amount < MIN_WITHDRAWAL) {
      throw new Error(`จำนวนเงินขั้นต่ำในการถอน ${MIN_WITHDRAWAL} บาท`);
    }
    if (amount > state.balance) {
      throw new Error('ยอดเงินไม่เพียงพอ');
    }

    const newRequest: WithdrawalRequest = {
      id: Date.now().toString(),
      amount,
      bankAccount,
      status: 'pending',
      requestedAt: new Date()
    };

    set((state) => ({
      withdrawalRequests: [newRequest, ...state.withdrawalRequests],
      pendingWithdrawals: state.pendingWithdrawals + amount,
      balance: state.balance - amount
    }));
  },

  updateWithdrawalStatus: (id, status, reason) => {
    set((state) => ({
      withdrawalRequests: state.withdrawalRequests.map(req =>
        req.id === id
          ? { ...req, status, processedAt: new Date(), reason }
          : req
      )
    }));
  },

  getEarningsStats: () => {
    const state = get();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayEarnings = state.transactions
      .filter(t => 
        (t.type === 'earning' || t.type === 'bonus') &&
        t.createdAt.toISOString().split('T')[0] === today
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const weekEarnings = state.transactions
      .filter(t => 
        (t.type === 'earning' || t.type === 'bonus') &&
        t.createdAt >= weekAgo
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const monthEarnings = state.transactions
      .filter(t => 
        (t.type === 'earning' || t.type === 'bonus') &&
        t.createdAt >= monthAgo
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      today: todayEarnings,
      thisWeek: weekEarnings,
      thisMonth: monthEarnings
    };
  }
}));

export class WalletManager {
  static async processEarning(orderId: string, amount: number, description: string) {
    const store = useWalletStore.getState();
    store.addTransaction({
      type: 'earning',
      amount,
      description,
      orderId,
      status: 'completed'
    });
  }

  static async addBonus(amount: number, description: string) {
    const store = useWalletStore.getState();
    store.addTransaction({
      type: 'bonus',
      amount,
      description,
      status: 'completed'
    });
  }

  static async processWithdrawal(amount: number, bankAccount: string) {
    const MIN_WITHDRAWAL = 100;
    
    if (amount < MIN_WITHDRAWAL) {
      return { success: false, error: `จำนวนเงินขั้นต่ำในการถอน ${MIN_WITHDRAWAL} บาท` };
    }
    
    try {
      const store = useWalletStore.getState();
      store.requestWithdrawal(amount, bankAccount);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static getMinWithdrawal() {
    return 100;
  }

  static getTransactionIcon(type: Transaction['type']) {
    switch (type) {
      case 'earning': return '💰';
      case 'bonus': return '🎁';
      case 'withdrawal': return '🏦';
      case 'penalty': return '⚠️';
      case 'refund': return '↩️';
      default: return '💳';
    }
  }

  static getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed':
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
}