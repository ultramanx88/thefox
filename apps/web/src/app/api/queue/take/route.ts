import { NextRequest, NextResponse } from 'next/server';
import { QueueService } from '@repo/api/src/firebase/queue';

export async function POST(req: NextRequest) {
  try {
    const { branchId, customerName, customerPhone, note } = await req.json();
    if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 });

    const queue = await QueueService.takeQueue(branchId, { customerName, customerPhone, note });
    const estimatedWait = await QueueService.getEstimatedWait(branchId);

    return NextResponse.json({ queue, estimatedWait });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
