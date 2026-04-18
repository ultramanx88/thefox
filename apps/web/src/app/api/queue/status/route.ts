import { NextRequest, NextResponse } from 'next/server';
import { QueueService } from '@repo/api/src/firebase/queue';
import type { QueueStatus } from '@repo/api/src/types';

export async function PATCH(req: NextRequest) {
  try {
    const { queueId, status } = await req.json();
    if (!queueId || !status) {
      return NextResponse.json({ error: 'queueId and status required' }, { status: 400 });
    }

    await QueueService.updateStatus(queueId, status as QueueStatus);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
