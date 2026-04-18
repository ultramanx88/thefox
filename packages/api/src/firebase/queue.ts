import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  onSnapshot, query, where, orderBy, serverTimestamp,
  runTransaction, increment,
} from 'firebase/firestore';
import { db } from './config';
import type { Queue, QueueBranch, QueueStatus } from '../types';

const queuesCol = () => collection(db, 'queues');
const branchesCol = () => collection(db, 'queueBranches');

export const QueueService = {
  // ─── Branch ────────────────────────────────────────────────────────────────

  getBranch: async (branchId: string): Promise<QueueBranch | null> => {
    const snap = await getDoc(doc(db, 'queueBranches', branchId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as QueueBranch;
  },

  getBranches: async (): Promise<QueueBranch[]> => {
    const snap = await getDocs(query(branchesCol(), where('isOpen', '==', true)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as QueueBranch);
  },

  // ─── Take queue number ──────────────────────────────────────────────────────

  takeQueue: async (
    branchId: string,
    data?: { customerName?: string; customerPhone?: string; note?: string }
  ): Promise<Queue> => {
    const branchRef = doc(db, 'queueBranches', branchId);

    return runTransaction(db, async (tx) => {
      const branchSnap = await tx.get(branchRef);
      if (!branchSnap.exists()) throw new Error('Branch not found');

      const branch = branchSnap.data() as QueueBranch;
      const nextNumber = (branch.currentNumber ?? 0) + 1;

      // Update branch counter
      tx.update(branchRef, { currentNumber: increment(1) });

      // Create queue entry
      const queueRef = doc(queuesCol());
      const queue: Omit<Queue, 'id'> = {
        branchId,
        branchName: branch.name,
        number: nextNumber,
        status: 'waiting',
        customerName: data?.customerName,
        customerPhone: data?.customerPhone,
        note: data?.note,
        createdAt: new Date().toISOString(),
      };
      tx.set(queueRef, { ...queue, createdAt: serverTimestamp() });

      return { id: queueRef.id, ...queue };
    });
  },

  // ─── Call next ──────────────────────────────────────────────────────────────

  callNext: async (branchId: string, counter: string): Promise<Queue | null> => {
    const q = query(
      queuesCol(),
      where('branchId', '==', branchId),
      where('status', '==', 'waiting'),
      orderBy('number', 'asc')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const next = snap.docs[0];
    await updateDoc(next.ref, {
      status: 'called',
      counter,
      calledAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'queueBranches', branchId), {
      callingNumber: next.data().number,
    });

    return { id: next.id, ...next.data() } as Queue;
  },

  // ─── Update status ──────────────────────────────────────────────────────────

  updateStatus: async (queueId: string, status: QueueStatus): Promise<void> => {
    const updates: Record<string, unknown> = { status };
    if (status === 'serving') updates.servedAt = serverTimestamp();
    if (status === 'done') updates.doneAt = serverTimestamp();
    await updateDoc(doc(db, 'queues', queueId), updates);
  },

  // ─── Queries ────────────────────────────────────────────────────────────────

  getWaitingQueues: async (branchId: string): Promise<Queue[]> => {
    const q = query(
      queuesCol(),
      where('branchId', '==', branchId),
      where('status', 'in', ['waiting', 'called', 'serving']),
      orderBy('number', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Queue);
  },

  getQueueByPhone: async (branchId: string, phone: string): Promise<Queue | null> => {
    const q = query(
      queuesCol(),
      where('branchId', '==', branchId),
      where('customerPhone', '==', phone),
      where('status', 'in', ['waiting', 'called', 'serving']),
      orderBy('number', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Queue;
  },

  // ─── Realtime ───────────────────────────────────────────────────────────────

  onQueueChange: (
    branchId: string,
    callback: (queues: Queue[]) => void
  ) => {
    const q = query(
      queuesCol(),
      where('branchId', '==', branchId),
      where('status', 'in', ['waiting', 'called', 'serving']),
      orderBy('number', 'asc')
    );
    return onSnapshot(q, (snap) =>
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Queue))
    );
  },

  onBranchChange: (branchId: string, callback: (branch: QueueBranch) => void) =>
    onSnapshot(doc(db, 'queueBranches', branchId), (snap) => {
      if (snap.exists()) callback({ id: snap.id, ...snap.data() } as QueueBranch);
    }),

  // ─── Stats ──────────────────────────────────────────────────────────────────

  getEstimatedWait: async (branchId: string): Promise<number> => {
    const branch = await QueueService.getBranch(branchId);
    return branch?.avgWaitMinutes ?? 5;
  },
};
