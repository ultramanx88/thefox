interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  icon: string;
  enabled: boolean;
}

interface PaymentRequest {
  orderId: string;
  amount: number;
  currency?: string;
  customerId: string;
  paymentMethodId: string;
  description?: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  qrCode?: string;
  error?: string;
}

export class PaymentClient {
  private static readonly BASE_URL = '/api/payment';

  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(this.BASE_URL);
      const data = await response.json();
      return data.success ? data.paymentMethods : [];
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      return [];
    }
  }

  static async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  static async verifyPayment(transactionId: string): Promise<{ verified: boolean; status: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId })
      });
      const data = await response.json();
      return data.success ? { verified: data.verified, status: data.status } : { verified: false, status: 'error' };
    } catch (error) {
      return { verified: false, status: 'error' };
    }
  }

  static async refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, amount })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  static async pollPaymentStatus(transactionId: string, maxAttempts = 30): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.verifyPayment(transactionId);
      if (result.verified && result.status === 'completed') {
        return 'completed';
      }
      if (result.status === 'failed') {
        return 'failed';
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
    return 'timeout';
  }
}