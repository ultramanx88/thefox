import { NextRequest, NextResponse } from 'next/server';
import { QueueService } from '@repo/api/src/firebase/queue';

export async function POST(req: NextRequest) {
  try {
    const { branchId, counter } = await req.json();
    if (!branchId || !counter) {
      return NextResponse.json({ error: 'branchId and counter required' }, { status: 400 });
    }

    const queue = await QueueService.callNext(branchId, counter);
    if (!queue) return NextResponse.json({ message: 'No waiting queues' }, { status: 200 });

    return NextResponse.json({ queue });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
