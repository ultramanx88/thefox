'use client';

import { useState } from 'react';
import { useWalletStore, WalletManager } from '@/lib/wallet-manager';

export default function WalletDashboard() {
  const { 
    balance, 
    totalEarnings, 
    pendingWithdrawals, 
    transactions, 
    withdrawalRequests,
    dailyEarnings,
    getEarningsStats 
  } = useWalletStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdrawals'>('overview');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  const stats = getEarningsStats();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">กระเป๋าเงินคนขับ</h1>
        <p className="text-gray-600">จัดการเงินรายได้และการถอนเงิน</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">ยอดเงินคงเหลือ</p>
              <p className="text-2xl font-bold">฿{balance.toLocaleString()}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">รายได้วันนี้</p>
              <p className="text-2xl font-bold">฿{stats.today.toLocaleString()}</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">รายได้รวม</p>
              <p className="text-2xl font-bold">฿{totalEarnings.toLocaleString()}</p>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">รอถอน</p>
              <p className="text-2xl font-bold">฿{pendingWithdrawals.toLocaleString()}</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">การดำเนินการด่วน</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>🏦</span>
            ถอนเงิน
          </button>
          <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
            <span>📊</span>
            รายงานรายได้
          </button>
          <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
            <span>🎯</span>
            เป้าหมายรายได้
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex">
            {[
              { key: 'overview', label: 'ภาพรวม', icon: '📊' },
              { key: 'transactions', label: 'ธุรกรรม', icon: '💳' },
              { key: 'withdrawals', label: 'การถอนเงิน', icon: '🏦' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Earnings Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-4">รายได้ 7 วันล่าสุด</h3>
                <div className="grid grid-cols-7 gap-2">
                  {dailyEarnings.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-blue-100 rounded-lg p-3 mb-2">
                        <div 
                          className="bg-blue-500 rounded"
                          style={{ 
                            height: `${Math.max(20, (day.amount / 500) * 60)}px`,
                            width: '100%'
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">{new Date(day.date).getDate()}</p>
                      <p className="text-sm font-medium">฿{day.amount}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h3 className="text-lg font-semibold mb-4">ธุรกรรมล่าสุด</h3>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{WalletManager.getTransactionIcon(transaction.type)}</span>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.createdAt.toLocaleDateString('th-TH')} {transaction.createdAt.toLocaleTimeString('th-TH')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount >= 0 ? '+' : ''}฿{Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <p className={`text-sm ${WalletManager.getStatusColor(transaction.status)}`}>
                          {transaction.status === 'completed' ? 'สำเร็จ' : 
                           transaction.status === 'pending' ? 'รอดำเนินการ' : 'ล้มเหลว'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">ประวัติธุรกรรมทั้งหมด</h3>
                <select className="border rounded-lg px-3 py-2">
                  <option>ทั้งหมด</option>
                  <option>รายได้</option>
                  <option>โบนัส</option>
                  <option>การถอนเงิน</option>
                </select>
              </div>
              
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{WalletManager.getTransactionIcon(transaction.type)}</span>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.createdAt.toLocaleDateString('th-TH')} {transaction.createdAt.toLocaleTimeString('th-TH')}
                        </p>
                        {transaction.orderId && (
                          <p className="text-xs text-blue-600">Order: {transaction.orderId}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount >= 0 ? '+' : ''}฿{Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <p className={`text-sm ${WalletManager.getStatusColor(transaction.status)}`}>
                        {transaction.status === 'completed' ? 'สำเร็จ' : 
                         transaction.status === 'pending' ? 'รอดำเนินการ' : 'ล้มเหลว'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">ประวัติการถอนเงิน</h3>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  ถอนเงินใหม่
                </button>
              </div>
              
              <div className="space-y-3">
                {withdrawalRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">฿{request.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{request.bankAccount}</p>
                        <p className="text-xs text-gray-500">
                          {request.requestedAt.toLocaleDateString('th-TH')} {request.requestedAt.toLocaleTimeString('th-TH')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'completed' ? 'สำเร็จ' :
                           request.status === 'pending' ? 'รอดำเนินการ' :
                           request.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                        </span>
                        {request.reason && (
                          <p className="text-xs text-gray-500 mt-1">{request.reason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <WithdrawalModal onClose={() => setShowWithdrawModal(false)} />
      )}
    </div>
  );
}

function WithdrawalModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const { balance, requestWithdrawal } = useWalletStore();
  const MIN_WITHDRAWAL = 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);
    
    if (withdrawAmount < MIN_WITHDRAWAL) {
      alert(`จำนวนเงินขั้นต่ำในการถอน ${MIN_WITHDRAWAL} บาท`);
      return;
    }
    
    try {
      requestWithdrawal(withdrawAmount, bankAccount);
      onClose();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">ถอนเงิน</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">จำนวนเงิน</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="0.00"
              min={MIN_WITHDRAWAL}
              max={balance}
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              ยอดคงเหลือ: ฿{balance.toLocaleString()} | ขั้นต่ำ: ฿{MIN_WITHDRAWAL}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">บัญชีธนาคาร</label>
            <select
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">เลือกบัญชี</option>
              <option value="Bangkok Bank ***1234">Bangkok Bank ***1234</option>
              <option value="Kasikorn Bank ***5678">Kasikorn Bank ***5678</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              ถอนเงิน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}