/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header';
import { Button } from './components/ui/button';
import { Dog, Truck, ShieldCheck, Clock, Phone, MapPin } from 'lucide-react';
import { useCartStore } from './store/cart';

const queryClient = new QueryClient();

import { ProductService } from './services/productService';
import { Product } from './types';

function HomePage() {
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Subscribe to real-time updates for high performance
    const unsubscribe = ProductService.subscribeToProducts((data) => {
      if (data.length > 0) {
        setProducts(data);
      } else {
        // Fallback to static data if Firestore is empty (Initial seed)
        setProducts([
          { id: '1', name: 'ผักบุ้งจีนสด', price: 25, image: 'https://picsum.photos/seed/veg1/400/300', unit: 'กำ', category: 'ผักสด', vendorId: 'v1', stock: 10, description: 'สดใหม่จากสวน' },
          { id: '2', name: 'ไข่ไก่เบอร์ 2 (30 ฟอง)', price: 125, image: 'https://picsum.photos/seed/egg/400/300', unit: 'แพ็ค', category: 'เนื้อและไข่', vendorId: 'v1', stock: 50, description: 'ไข่สดส่งตรงจากฟาร์ม' },
          { id: '3', name: 'เนื้อหมูสันนอก 1กก.', price: 185, image: 'https://picsum.photos/seed/pork/400/300', unit: 'kg', category: 'เนื้อสด', vendorId: 'v2', stock: 20, description: 'เนื้อหมูสะอาด อนามัย' },
          { id: '4', name: 'มะม่วงน้ำดอกไม้', price: 65, image: 'https://picsum.photos/seed/mango/400/300', unit: 'kg', category: 'ผลไม้', vendorId: 'v2', stock: 15, description: 'หวาน หอม อร่อย' },
        ] as any);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const features = [
    { icon: <Truck className="h-6 w-6 text-rose-600" />, title: 'ส่งฟรี', desc: 'เมื่อสั่งซื้อครบ 499 บาท' },
    { icon: <ShieldCheck className="h-6 w-6 text-rose-600" />, title: 'ของสด 100%', desc: 'คัดสรรจากตลาดโดยตรง' },
    { icon: <Clock className="h-6 w-6 text-rose-600" />, title: 'ส่งไว', desc: 'ได้รับสินค้าภายในวันเดียว' },
    { icon: <Dog className="h-6 w-6 text-rose-600" />, title: 'ออร์แกนิก', desc: 'สินค้าคุณภาพ ปลอดสารพิษ' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-rose-50 py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-sm font-bold mb-4">
              ตลาดสดออนไลน์ 24 ชั่วโมง
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              สั่งของสดจากตลาด <br />
              <span className="text-rose-600">ส่งตรงถึงหน้าบ้านคุณ</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-xl">
              theFOX เชื่อมต่อคุณกับตลาดสดท้องถิ่น คัดสรรวัตถุดิบคุณภาพดีที่สุด 
              ส่งตรงถึงมือคุณด้วยความใส่ใจ เพื่อมื้ออาหารที่พิเศษที่สุดของครอบครัว
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white text-lg px-8">
                เริ่มช้อปเลย
              </Button>
              <Button size="lg" variant="outline" className="border-rose-600 text-rose-700 text-lg px-8">
                ดูร้านค้าทั้งหมด
              </Button>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform rotate-3">
              <img 
                src="https://picsum.photos/seed/market/800/600" 
                alt="Fresh Market" 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-orange-200 rounded-full blur-3xl opacity-50"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="mb-4 p-3 rounded-full bg-rose-50">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">สินค้าแนะนำ</h2>
              <p className="text-gray-500">วัตถุดิบยอดนิยมที่ทุกคนเลือกใช้</p>
            </div>
            <Button variant="link" className="text-rose-600 font-bold">ดูทั้งหมด</Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((p) => (
              <div key={p.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative aspect-square overflow-hidden">
                  <img 
                    src={p.imageUrl} 
                    alt={p.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3">
                    <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <Dog className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-rose-600 transition-colors">{p.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-rose-700">฿{p.price}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 rounded-full hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => addItem(p)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Dog className="h-8 w-8 text-rose-500" />
                <span className="text-2xl font-bold tracking-tight">theFOX</span>
              </div>
              <p className="text-gray-400 max-w-md mb-6">
                เราคือแพลตฟอร์มที่เชื่อมต่อผู้บริโภคกับตลาดสดท้องถิ่น เพื่อสนับสนุนเกษตรกรและพ่อค้าแม่ค้าในชุมชน 
                พร้อมส่งมอบวัตถุดิบที่สดใหม่และปลอดภัยถึงมือคุณ
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">เมนูหลัก</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-rose-500 transition-colors">หน้าแรก</a></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">ร้านค้า</a></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">สินค้าทั้งหมด</a></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">โปรโมชั่น</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">ติดต่อเรา</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-center gap-3"><Phone className="h-4 w-4" /> 02-123-4567</li>
                <li className="flex items-center gap-3"><MapPin className="h-4 w-4" /> กรุงเทพมหานคร</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            © 2026 theFOX. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
