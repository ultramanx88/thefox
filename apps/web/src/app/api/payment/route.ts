import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payment/payment-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, currency = 'THB', customerId, paymentMethodId, description } = body;

    if (!orderId || !amount || !customerId || !paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const paymentRequest = {
      orderId,
      amount: parseFloat(amount),
      currency,
      customerId,
      paymentMethodId,
      description
    };

    const result = await PaymentService.processPayment(paymentRequest);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const paymentMethods = PaymentService.getPaymentMethods();
    return NextResponse.json({ success: true, paymentMethods });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}