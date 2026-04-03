interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'promptpay' | 'truemoney' | 'bank_transfer' | 'cash';
  name: string;
  icon: string;
  enabled: boolean;
}

interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
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

export class PaymentService {
  private static readonly PAYMENT_METHODS: PaymentMethod[] = [
    { id: 'credit_card', type: 'credit_card', name: 'บัตรเครดิต/เดบิต', icon: '💳', enabled: true },
    { id: 'promptpay', type: 'promptpay', name: 'PromptPay', icon: '📱', enabled: true },
    { id: 'truemoney', type: 'truemoney', name: 'TrueMoney Wallet', icon: '💰', enabled: true },
    { id: 'bank_transfer', type: 'bank_transfer', name: 'โอนเงินผ่านธนาคาร', icon: '🏦', enabled: true },
    { id: 'cash', type: 'cash', name: 'เงินสด', icon: '💵', enabled: true }
  ];

  static getPaymentMethods(): PaymentMethod[] {
    return this.PAYMENT_METHODS.filter(method => method.enabled);
  }

  static async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const method = this.PAYMENT_METHODS.find(m => m.id === request.paymentMethodId);
      if (!method) {
        return { success: false, error: 'Invalid payment method' };
      }

      switch (method.type) {
        case 'credit_card':
          return await this.processCreditCard(request);
        case 'promptpay':
          return await this.processPromptPay(request);
        case 'truemoney':
          return await this.processTrueMoney(request);
        case 'bank_transfer':
          return await this.processBankTransfer(request);
        case 'cash':
          return await this.processCash(request);
        default:
          return { success: false, error: 'Unsupported payment method' };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private static async processCreditCard(request: PaymentRequest): Promise<PaymentResponse> {
    // Simulate Omise/Stripe integration
    const transactionId = `cc_${Date.now()}`;
    return {
      success: true,
      transactionId,
      paymentUrl: `https://checkout.omise.co/pay/${transactionId}`
    };
  }

  private static async processPromptPay(request: PaymentRequest): Promise<PaymentResponse> {
    // Generate PromptPay QR Code
    const transactionId = `pp_${Date.now()}`;
    const qrCode = this.generatePromptPayQR(request.amount, transactionId);
    return {
      success: true,
      transactionId,
      qrCode
    };
  }

  private static async processTrueMoney(request: PaymentRequest): Promise<PaymentResponse> {
    // TrueMoney Wallet integration
    const transactionId = `tm_${Date.now()}`;
    return {
      success: true,
      transactionId,
      paymentUrl: `https://tmn.app/pay/${transactionId}`
    };
  }

  private static async processBankTransfer(request: PaymentRequest): Promise<PaymentResponse> {
    // Bank transfer details
    const transactionId = `bt_${Date.now()}`;
    return {
      success: true,
      transactionId
    };
  }

  private static async processCash(request: PaymentRequest): Promise<PaymentResponse> {
    // Cash on delivery
    const transactionId = `cash_${Date.now()}`;
    return {
      success: true,
      transactionId
    };
  }

  private static generatePromptPayQR(amount: number, ref: string): string {
    // Simplified QR code generation (in real app, use proper QR library)
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
  }

  static async verifyPayment(transactionId: string): Promise<{ verified: boolean; status: string }> {
    // Simulate payment verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      verified: Math.random() > 0.1, // 90% success rate
      status: Math.random() > 0.1 ? 'completed' : 'failed'
    };
  }

  static async refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse> {
    // Simulate refund process
    const refundId = `ref_${Date.now()}`;
    return {
      success: true,
      transactionId: refundId
    };
  }
}