import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const stats = {
      totalOrders: 1247,
      totalRevenue: 89650.50,
      totalProducts: 156,
      totalUsers: 2341,
      recentOrders: [
        {
          id: 'ord_1234567890',
          customerName: 'John Doe',
          total: 89.99,
          status: 'completed',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ord_1234567891',
          customerName: 'Jane Smith',
          total: 156.50,
          status: 'processing',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}