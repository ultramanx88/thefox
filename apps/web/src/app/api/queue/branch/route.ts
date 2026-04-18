import { NextRequest, NextResponse } from 'next/server';
import { QueueService } from '@repo/api/src/firebase/queue';

export async function GET(req: NextRequest) {
  try {
    const branchId = req.nextUrl.searchParams.get('branchId');
    if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 });

    const [branch, queues] = await Promise.all([
      QueueService.getBranch(branchId),
      QueueService.getWaitingQueues(branchId),
    ]);

    return NextResponse.json({
      branch,
      waitingCount: queues.filter((q) => q.status === 'waiting').length,
      calledCount: queues.filter((q) => q.status === 'called').length,
      queues,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
