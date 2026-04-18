'use client';
import { useState } from 'react';
import { useQueue } from '@/hooks/useQueue';
import type { Queue } from '@repo/api/src/types';

const STATUS_LABEL: Record<Queue['status'], string> = {
  waiting: 'รอ',
  called: 'เรียกแล้ว',
  serving: 'กำลังให้บริการ',
  done: 'เสร็จแล้ว',
  skipped: 'ข้าม',
};

const STATUS_COLOR: Record<Queue['status'], string> = {
  waiting: 'bg-yellow-100 text-yellow-700',
  called: 'bg-blue-100 text-blue-700',
  serving: 'bg-green-100 text-green-700',
  done: 'bg-gray-100 text-gray-500',
  skipped: 'bg-red-100 text-red-500',
};

export default function VendorQueueBoard({ params }: { params: { branchId: string } }) {
  const { branch, queues, waiting, called, loading, callNext, updateStatus } = useQueue(params.branchId);
  const [counter, setCounter] = useState(branch?.counters?.[0] ?? 'A');
  const [calling, setCalling] = useState(false);

  const handleCallNext = async () => {
    setCalling(true);
    try {
      const q = await callNext(counter);
      if (!q) alert('ไม่มีคิวรออยู่');
    } finally {
      setCalling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-500 text-white p-6">
        <h1 className="text-xl font-bold">{branch?.name} — จัดการคิว</h1>
        <p className="text-orange-100 text-sm mt-1">
          รอ {waiting.length} คิว · กำลังให้บริการ {called.length} คิว
        </p>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Call next */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium text-gray-700">ช่องบริการ</label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
            >
              {(branch?.counters ?? ['A', 'B', 'C']).map((c) => (
                <option key={c} value={c}>ช่อง {c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCallNext}
            disabled={calling || waiting.length === 0}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40 active:scale-95 transition-transform"
          >
            {calling ? 'กำลังเรียก...' : `เรียกคิวถัดไป (ช่อง ${counter})`}
          </button>
        </div>

        {/* Currently called */}
        {called.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">กำลังให้บริการ</h2>
            <div className="space-y-2">
              {called.map((q) => (
                <div key={q.id} className="flex items-center justify-between bg-blue-50 rounded-xl p-4">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">
                      #{String(q.number).padStart(3, '0')}
                    </span>
                    {q.counter && <span className="text-sm text-gray-500 ml-2">ช่อง {q.counter}</span>}
                    {q.customerName && <p className="text-sm text-gray-600 mt-1">{q.customerName}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(q.id, 'serving')}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"
                    >
                      ให้บริการ
                    </button>
                    <button
                      onClick={() => updateStatus(q.id, 'done')}
                      className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium"
                    >
                      เสร็จ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiting list */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-3">คิวที่รออยู่ ({waiting.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {waiting.map((q) => (
              <div key={q.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-bold text-gray-700">
                    #{String(q.number).padStart(3, '0')}
                  </span>
                  {q.customerName && (
                    <span className="text-sm text-gray-500 ml-2">{q.customerName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[q.status]}`}>
                    {STATUS_LABEL[q.status]}
                  </span>
                  <button
                    onClick={() => updateStatus(q.id, 'skipped')}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    ข้าม
                  </button>
                </div>
              </div>
            ))}
            {waiting.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">ไม่มีคิวรออยู่ 🎉</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
