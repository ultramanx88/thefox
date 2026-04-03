'use client';

import { useState } from 'react';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  addedAt: Date;
}

export default function BankAccountManager() {
  const [accounts, setAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      bankName: 'ธนาคารกรุงเทพ',
      accountNumber: '1234567890',
      accountName: 'สมชาย ใจดี',
      isDefault: true,
      isVerified: true,
      addedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      bankName: 'ธนาคารกสิกรไทย',
      accountNumber: '0987654321',
      accountName: 'สมชาย ใจดี',
      isDefault: false,
      isVerified: false,
      addedAt: new Date('2024-01-10')
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const account: BankAccount = {
      id: Date.now().toString(),
      ...newAccount,
      isDefault: accounts.length === 0,
      isVerified: false,
      addedAt: new Date()
    };
    setAccounts([...accounts, account]);
    setNewAccount({ bankName: '', accountNumber: '', accountName: '' });
    setShowAddModal(false);
  };

  const setDefaultAccount = (id: string) => {
    setAccounts(accounts.map(acc => ({
      ...acc,
      isDefault: acc.id === id
    })));
  };

  const deleteAccount = (id: string) => {
    if (window.confirm('คุณต้องการลบบัญชีนี้หรือไม่?')) {
      setAccounts(accounts.filter(acc => acc.id !== id));
    }
  };

  const bankOptions = [
    'ธนาคารกรุงเทพ',
    'ธนาคารกสิกรไทย',
    'ธนาคารไทยพาณิชย์',
    'ธนาคารกรุงไทย',
    'ธนาคารทหารไทยธนชาต',
    'ธนาคารกรุงศรีอยุธยา',
    'ธนาคารเกียรตินาคินภัทร'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการบัญชีธนาคาร</h1>
        <p className="text-gray-600">เพิ่มและจัดการบัญชีธนาคารสำหรับการถอนเงิน</p>
      </div>

      {/* Add Account Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          เพิ่มบัญชีธนาคาร
        </button>
      </div>

      {/* Account List */}
      <div className="space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">🏦</span>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{account.bankName}</h3>
                    {account.isDefault && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        บัญชีหลัก
                      </span>
                    )}
                    {account.isVerified ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ ยืนยันแล้ว
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        ⏳ รอยืนยัน
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-1">
                    เลขบัญชี: {account.accountNumber.replace(/(\d{3})(\d{1})(\d{5})(\d{1})/, '$1-$2-$3-$4')}
                  </p>
                  <p className="text-gray-600 mb-2">ชื่อบัญชี: {account.accountName}</p>
                  <p className="text-sm text-gray-500">
                    เพิ่มเมื่อ: {account.addedAt.toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!account.isDefault && account.isVerified && (
                  <button
                    onClick={() => setDefaultAccount(account.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ตั้งเป็นหลัก
                  </button>
                )}
                
                <button
                  onClick={() => deleteAccount(account.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium ml-4"
                >
                  ลบ
                </button>
              </div>
            </div>

            {!account.isVerified && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  📋 กรุณาอัปโหลดสำเนาหน้าสมุดบัญชีเพื่อยืนยันบัญชี
                </p>
                <button className="text-yellow-700 hover:text-yellow-900 text-sm font-medium mt-1">
                  อัปโหลดเอกสาร →
                </button>
              </div>
            )}
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีบัญชีธนาคาร</h3>
            <p className="text-gray-600 mb-4">เพิ่มบัญชีธนาคารเพื่อรับเงินจากการส่งอาหาร</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              เพิ่มบัญชีแรก
            </button>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">เพิ่มบัญชีธนาคาร</h2>
            
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">ธนาคาร</label>
                <select
                  value={newAccount.bankName}
                  onChange={(e) => setNewAccount({...newAccount, bankName: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">เลือกธนาคาร</option>
                  {bankOptions.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">เลขบัญชี</label>
                <input
                  type="text"
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({...newAccount, accountNumber: e.target.value.replace(/\D/g, '')})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="1234567890"
                  maxLength={12}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ชื่อบัญชี</label>
                <input
                  type="text"
                  value={newAccount.accountName}
                  onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="ชื่อ-นามสกุล ตามบัญชี"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  💡 <strong>หมายเหตุ:</strong> กรุณาตรวจสอบข้อมูลให้ถูกต้อง เพื่อป้องกันปัญหาในการโอนเงิน
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  เพิ่มบัญชี
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">🔒 ความปลอดภัย</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• ข้อมูลบัญชีธนาคารของคุณจะถูกเข้ารหัสและเก็บอย่างปลอดภัย</li>
          <li>• การถอนเงินจะใช้เวลา 1-3 วันทำการ</li>
          <li>• ตรวจสอบข้อมูลบัญชีให้ถูกต้องเพื่อป้องกันการโอนผิดพลาด</li>
          <li>• หากมีปัญหาการโอนเงิน กรุณาติดต่อฝ่ายสนับสนุน</li>
        </ul>
      </div>
    </div>
  );
}