import { type Product } from './types';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'กะหล่ำปลีออร์แกนิก',
    description: "กะหล่ำปลีสดใหม่จากฟาร์มออร์แกนิก ปลูกด้วยความใส่ใจ ปลอดสารเคมี เหมาะสำหรับทำอาหารได้หลากหลายเมนู",
    price: 35.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'ร้านผักป้านี',
    vendorId: '456',
    rating: 4.8,
    reviewCount: 75,
    dataAiHint: 'cabbage vegetable',
  },
  {
    id: '2',
    name: 'เนื้อสันในวัว',
    description: 'เนื้อสันในวัวโคขุนคุณภาพพรีเมี่ยม นุ่มละมุน เหมาะสำหรับทำสเต็กหรืออาหารจานหรู',
    price: 350.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'เขียงเนื้อลุงเดช',
    vendorId: '789',
    rating: 5.0,
    reviewCount: 42,
    dataAiHint: 'beef steak',
  },
  {
    id: '3',
    name: 'มะม่วงน้ำดอกไม้',
    description: 'มะม่วงน้ำดอกไม้เกรดส่งออก หวานหอม เนื้อเนียน ไม่มีเสี้ยน',
    price: 60.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'สวนผลไม้ป้าไหว',
    vendorId: '101',
    rating: 4.9,
    reviewCount: 150,
    dataAiHint: 'mango fruit',
  },
  {
    id: '4',
    name: 'ปลาแซลมอนสด (ต่อ กก.)',
    description: 'ปลาแซลมอนนอร์เวย์สด แล่ชิ้นสวยงาม เหมาะสำหรับทำซาชิมิหรือย่าง',
    price: 750.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'เจ๊ออยอาหารทะเล',
    vendorId: '112',
    rating: 4.9,
    reviewCount: 88,
    dataAiHint: 'salmon seafood',
  },
  {
    id: '5',
    name: 'ไข่ไก่เบอร์ 0 (แผง)',
    description: 'ไข่ไก่สดจากแม่ไก่อารมณ์ดี เบอร์ 0 จำนวน 30 ฟองต่อแผง',
    price: 120.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'ฟาร์มไก่ลุงมี',
    vendorId: '113',
    rating: 4.7,
    reviewCount: 210,
    dataAiHint: 'fresh eggs',
  },
  {
    id: '6',
    name: 'มะนาวแป้น (ต่อ กก.)',
    description: 'มะนาวแป้นพิจิตรลูกใหญ่ น้ำเยอะ กลิ่นหอม เหมาะสำหรับปรุงอาหาร',
    price: 40.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'ร้านผักป้านี',
    vendorId: '456',
    rating: 4.9,
    reviewCount: 180,
    dataAiHint: 'lime fruit',
  },
  {
    id: '7',
    name: 'อกไก่ (ต่อ กก.)',
    description: 'อกไก่ล้วนไม่มีกระดูกและหนัง เหมาะสำหรับคนรักสุขภาพ',
    price: 85.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'ฟาร์มไก่ลุงมี',
    vendorId: '113',
    rating: 4.8,
    reviewCount: 195,
    dataAiHint: 'chicken breast',
  },
  {
    id: '8',
    name: 'กุ้งแม่น้ำ (ต่อ กก.)',
    description: 'กุ้งแม่น้ำเป็นๆ คัดขนาดใหญ่พิเศษ มันเยิ้มๆ เนื้อแน่น',
    price: 450.0,
    imageUrl: 'https://placehold.co/600x400.png',
    vendor: 'เจ๊ออยอาหารทะเล',
    vendorId: '112',
    rating: 4.8,
    reviewCount: 112,
    dataAiHint: 'river prawn',
  },
];

export async function getProducts(): Promise<Product[]> {
    return Promise.resolve(mockProducts);
}

export async function getProduct(id: string): Promise<Product | undefined> {
    return Promise.resolve(mockProducts.find(p => p.id === id));
}

export async function getProductsByVendorId(vendorId: string): Promise<Product[]> {
    return Promise.resolve(mockProducts.filter(p => p.vendorId === vendorId));
}
