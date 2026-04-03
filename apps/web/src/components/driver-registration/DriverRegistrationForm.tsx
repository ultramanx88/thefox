'use client';

import { useState } from 'react';
import { driverRegistrationManager } from '@/lib/driver-registration/driver-registration-manager';

export default function DriverRegistrationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      idCard: '',
      address: ''
    },
    vehicleInfo: {
      type: 'motorcycle' as const,
      licensePlate: '',
      brand: '',
      model: '',
      year: new Date().getFullYear()
    },
    documents: {
      idCardPhoto: '',
      drivingLicense: '',
      vehicleRegistration: '',
      profilePhoto: ''
    }
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleFileUpload = (field: string, file: File) => {
    // Simulate file upload
    const fakeUrl = `uploaded_${field}_${Date.now()}.jpg`;
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: fakeUrl
      }
    }));
  };

  const handleSubmit = () => {
    const registration = driverRegistrationManager.registerDriver(formData);
    setResult(registration);
    setIsSubmitted(true);
  };

  if (isSubmitted && result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-blue-500 text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">ส่งใบสมัครแล้ว!</h2>
          <p className="text-gray-600 mb-4">
            ใบสมัครของคุณอยู่ระหว่างการตรวจสอบ
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-700 mb-2">
              รหัสใบสมัคร: {result.id}
            </p>
            <p className="text-sm text-blue-700">
              คะแนนเบื้องต้น: {result.score}/100
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            สมัครใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">สมัครเป็นคนขับ</h1>
          
          {/* Progress */}
          <div className="flex justify-center mb-8">
            {[1, 2, 3].map(num => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= num ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}>
                  {num}
                </div>
                {num < 3 && <div className="w-12 h-1 bg-gray-200 mx-2"></div>}
              </div>
            ))}
          </div>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">ข้อมูลส่วนตัว</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={formData.personalInfo.name}
                  onChange={(e) => handleInputChange('personalInfo', 'name', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">อีเมล</label>
                  <input
                    type="email"
                    value={formData.personalInfo.email}
                    onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    placeholder="example@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">เบอร์โทร</label>
                  <input
                    type="tel"
                    value={formData.personalInfo.phone}
                    onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    placeholder="08xxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">เลขบัตรประชาชน</label>
                <input
                  type="text"
                  value={formData.personalInfo.idCard}
                  onChange={(e) => handleInputChange('personalInfo', 'idCard', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="1234567890123"
                  maxLength={13}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ที่อยู่</label>
                <textarea
                  value={formData.personalInfo.address}
                  onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                  placeholder="ที่อยู่ปัจจุบัน"
                />
              </div>
            </div>
          )}

          {/* Step 2: Vehicle Info */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">ข้อมูลยานพาหนะ</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">ประเภทยานพาหนะ</label>
                <select
                  value={formData.vehicleInfo.type}
                  onChange={(e) => handleInputChange('vehicleInfo', 'type', e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="motorcycle">มอเตอร์ไซค์</option>
                  <option value="car">รถยนต์</option>
                  <option value="bicycle">จักรยาน</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ทะเบียนรถ</label>
                  <input
                    type="text"
                    value={formData.vehicleInfo.licensePlate}
                    onChange={(e) => handleInputChange('vehicleInfo', 'licensePlate', e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    placeholder="1กก 1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">ยี่ห้อ</label>
                  <input
                    type="text"
                    value={formData.vehicleInfo.brand}
                    onChange={(e) => handleInputChange('vehicleInfo', 'brand', e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Honda, Yamaha, Toyota"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">รุ่น</label>
                  <input
                    type="text"
                    value={formData.vehicleInfo.model}
                    onChange={(e) => handleInputChange('vehicleInfo', 'model', e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Wave, Click, Vios"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">ปี</label>
                  <input
                    type="number"
                    value={formData.vehicleInfo.year}
                    onChange={(e) => handleInputChange('vehicleInfo', 'year', parseInt(e.target.value))}
                    className="w-full p-3 border rounded-lg"
                    min="2000"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">อัปโหลดเอกสาร</h2>
              
              {[
                { key: 'profilePhoto', label: 'รูปถ่าย', required: true },
                { key: 'idCardPhoto', label: 'รูปบัตรประชาชน', required: true },
                { key: 'drivingLicense', label: 'ใบขับขี่', required: true },
                { key: 'vehicleRegistration', label: 'ทะเบียนรถ', required: true }
              ].map(doc => (
                <div key={doc.key} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <label className="block text-sm font-medium mb-2">
                    {doc.label} {doc.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(doc.key, file);
                    }}
                    className="w-full"
                  />
                  {formData.documents[doc.key as keyof typeof formData.documents] && (
                    <p className="text-green-600 text-sm mt-2">✓ อัปโหลดแล้ว</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="px-6 py-2 border rounded-lg disabled:opacity-50"
            >
              ย้อนกลับ
            </button>
            
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                ถัดไป
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                ส่งใบสมัคร
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}