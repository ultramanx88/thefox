'use client';

import { useState } from 'react';
import { userRegistrationManager } from '@/lib/user-registration/registration-manager';

export default function UserRegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    userType: 'customer' as const
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = userRegistrationManager.register(formData);
    setRegistrationResult(result);
    setIsSubmitted(true);
    
    setFormData({
      name: '',
      email: '',
      phone: '',
      userType: 'customer'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSubmitted && registrationResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          {registrationResult.status === 'approved' ? (
            <>
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">ลงทะเบียนสำเร็จ!</h2>
              <p className="text-gray-600 mb-4">
                บัญชีของคุณได้รับการอนุมัติอัตโนมัติแล้ว
              </p>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-green-700">
                  รหัสผู้ใช้: {registrationResult.id}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-yellow-500 text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-yellow-600 mb-2">รอการอนุมัติ</h2>
              <p className="text-gray-600 mb-4">
                ข้อมูลของคุณอยู่ระหว่างการตรวจสอบ
              </p>
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-yellow-700">
                  เราจะแจ้งผลการอนุมัติผ่านอีเมล
                </p>
              </div>
            </>
          )}
          
          <button
            onClick={() => setIsSubmitted(false)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            ลงทะเบียนใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">ลงทะเบียนผู้ใช้งาน</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">ชื่อ-นามสกุล</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="กรอกชื่อ-นามสกุล"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">อีเมล</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="example@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="08xxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">ประเภทผู้ใช้</label>
            <select
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="customer">ลูกค้าทั่วไป</option>
              <option value="driver">คนส่งของ</option>
              <option value="business">ลูกค้าธุรกิจ</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-medium"
          >
            ลงทะเบียน
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">การอนุมัติอัตโนมัติ</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• อีเมลจาก Gmail, Hotmail, Yahoo</li>
            <li>• เบอร์โทรไทย (08xxxxxxxx, 09xxxxxxxx)</li>
            <li>• ไม่มีข้อมูลซ้ำในระบบ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}