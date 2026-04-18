'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Queue, QueueBranch } from '@repo/api/src/types';
import { useNativeBridge } from './useNativeBridge';

export function useQueue(branchId: string) {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [branch, setBranch] = useState<QueueBranch | null>(null);
  const [loading, setLoading] = useState(true);
  const { sendPrintQueueTicket, haptic } = useNativeBridge();

  // Realtime subscription via polling (SSE or Firestore direct can replace this)
  useEffect(() => {
    if (!branchId) return;

    const fetchQueues = async () => {
      try {
        const res = await fetch(`/api/queue/branch?branchId=${branchId}`);
        const data = await res.json();
        setBranch(data.branch);
        setQueues(data.queues ?? []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchQueues();
    const interval = setInterval(fetchQueues, 3000); // poll every 3s
    return () => clearInterval(interval);
  }, [branchId]);

  // Customer: take a queue number
  const takeQueue = useCallback(
    async (opts?: { customerName?: string; customerPhone?: string; note?: string }) => {
      const res = await fetch('/api/queue/take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId, ...opts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const queue: Queue = data.queue;
      haptic('medium');

      // Print ticket via native bridge
      sendPrintQueueTicket({
        jobId: queue.id,
        printerType: 'bluetooth',
        queueNumber: queue.number,
        branchName: queue.branchName,
        estimatedWait: data.estimatedWait ?? 10,
        timestamp: new Date().toLocaleString('th-TH'),
      });

      return queue;
    },
    [branchId, sendPrintQueueTicket, haptic]
  );

  // Vendor: call next queue
  const callNext = useCallback(
    async (counter: string) => {
      const res = await fetch('/api/queue/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId, counter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      haptic('heavy');
      return data.queue as Queue | null;
    },
    [branchId, haptic]
  );

  // Vendor: update queue status
  const updateStatus = useCallback(async (queueId: string, status: Queue['status']) => {
    await fetch('/api/queue/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId, status }),
    });
  }, []);

  const waiting = queues.filter((q) => q.status === 'waiting');
  const called = queues.filter((q) => q.status === 'called' || q.status === 'serving');

  return { queues, waiting, called, branch, loading, takeQueue, callNext, updateStatus };
}
