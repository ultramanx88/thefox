'use client';

import { WalletManager } from '@/lib/wallet-manager';

export default function WithdrawalPolicy() {
  const minWithdrawal = WalletManager.getMinWithdrawal();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">นโยบายการถอนเงิน</h1>
        <p className="text-gray-600">เงื่อนไขและข้อกำหนดในการถอนเงิน</p>
      </div>

      {/* Main Policy Card */}
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏦</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">จำนวนเงินขั้นต่ำในการถอน</h2>
          <div className="text-4xl font-bold text-blue-600 mb-4">฿{minWithdrawal}</div>
          <p className="text-gray-600">คุณสามารถถอนเงินได้เมื่อยอดเงินในกระเป๋าเงินมีอย่างน้อย {minWithdrawal} บาท</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-2">ถอนได้ทันที</h3>
            <p className="text-sm text-gray-600">เมื่อยอดเงินครบ {minWithdrawal} บาท สามารถขอถอนได้ทันที</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold mb-2">ปลอดภัย 100%</h3>
            <p className="text-sm text-gray-600">ระบบเข้ารหัสข้อมูลการเงินและยืนยันตัวตน</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">⏰</div>
            <h3 className="font-semibold mb-2">1-3 วันทำการ</h3>
            <p className="text-sm text-gray-600">เงินจะเข้าบัญชีภายใน 1-3 วันทำการ</p>
          </div>
        </div>
      </div>

      {/* Detailed Rules */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h3 className="text-xl font-semibold mb-6">เงื่อนไขการถอนเงิน</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
            <div>
              <h4 className="font-medium mb-1">จำนวนเงินขั้นต่ำ</h4>
              <p className="text-gray-600 text-sm">ต้องมียอดเงินในกระเป๋าเงินอย่างน้อย {minWithdrawal} บาท เพื่อสามารถขอถอนเงินได้</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
            <div>
              <h4 className="font-medium mb-1">บัญชีธนาคารที่ยืนยันแล้ว</h4>
              <p className="text-gray-600 text-sm">สามารถถอนเงินได้เฉพาะบัญชีธนาคารที่ผ่านการยืนยันตัวตนแล้วเท่านั้น</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
            <div>
              <h4 className="font-medium mb-1">ระยะเวลาการโอนเงิน</h4>
              <p className="text-gray-600 text-sm">เงินจะเข้าบัญชีภายใน 1-3 วันทำการ (ไม่รวมวันหงุดหยุดนักขัตฤกษ์)</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</div>
            <div>
              <h4 className="font-medium mb-1">ค่าธรรมเนียม</h4>
              <p className="text-gray-600 text-sm">ไม่มีค่าธรรมเนียมในการถอนเงิน บริษัทรับผิดชอบค่าธรรมเนียมการโอนทั้งหมด</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">5</div>
            <div>
              <h4 className="font-medium mb-1">จำนวนครั้งในการถอน</h4>
              <p className="text-gray-600 text-sm">สามารถขอถอนเงินได้ไม่เกิน 3 ครั้งต่อวัน และไม่เกิน 10 ครั้งต่อเดือน</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-semibold mb-6">คำถามที่พบบ่อย</h3>
        
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">❓ ทำไมต้องมียอดเงินขั้นต่ำ {minWithdrawal} บาท?</h4>
            <p className="text-gray-600 text-sm">เพื่อลดต้นทุนการดำเนินงานและค่าธรรมเนียมธนาคาร ทำให้เราสามารถให้บริการถอนเงินฟรีได้</p>
          </div>

          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">❓ ถ้ายอดเงินไม่ถึง {minWithdrawal} บาท จะทำอย่างไร?</h4>
            <p className="text-gray-600 text-sm">คุณสามารถทำงานต่อไปจนกว่ายอดเงินจะครบ {minWithdrawal} บาท หรือรอรับโบนัสเพิ่มเติม</p>
          </div>

          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">❓ สามารถถอนเงินบางส่วนได้หรือไม่?</h4>
            <p className="text-gray-600 text-sm">ได้ แต่ยอดเงินที่เหลือในกระเป๋าเงินหลังถอนต้องไม่ต่ำกว่า 0 บาท</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">❓ หากมีปัญหาการโอนเงินจะติดต่อที่ไหน?</h4>
            <p className="text-gray-600 text-sm">สามารถติดต่อฝ่ายสนับสนุนผ่านแชทในแอป หรือโทร 02-xxx-xxxx (24 ชั่วโมง)</p>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">ต้องการความช่วยเหลือ?</h3>
        <p className="text-gray-600 mb-4">ทีมสนับสนุนพร้อมช่วยเหลือคุณ 24 ชั่วโมง</p>
        <div className="flex justify-center gap-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <span>💬</span>
            แชทสด
          </button>
          <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
            <span>📞</span>
            โทรหาเรา
          </button>
        </div>
      </div>
    </div>
  );
}