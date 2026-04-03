import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    // Handle different webhook events
    switch (event) {
      case 'payment.completed':
        await handlePaymentCompleted(data);
        break;
      case 'payment.failed':
        await handlePaymentFailed(data);
        break;
      case 'refund.completed':
        await handleRefundCompleted(data);
        break;
      default:
        console.log('Unknown webhook event:', event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCompleted(data: any) {
  // Update order status, send notifications, etc.
  console.log('Payment completed:', data);
}

async function handlePaymentFailed(data: any) {
  // Handle failed payment, notify customer, etc.
  console.log('Payment failed:', data);
}

async function handleRefundCompleted(data: any) {
  // Handle refund completion
  console.log('Refund completed:', data);
}