import { type Vendor } from './types';

const mockVendors: Vendor[] = [
    {
        id: '456',
        name: 'ร้านผักป้านี',
        description: 'ผักสด ผลไม้ตามฤดูกาล ปลอดสารพิษ ส่งตรงจากสวนถึงมือคุณ',
        avatarUrl: 'https://placehold.co/128x128.png',
        bannerUrl: 'https://placehold.co/1600x400.png',
        rating: 4.7,
        reviewCount: 255
    },
    {
        id: '789',
        name: 'เขียงเนื้อลุงเดช',
        description: 'เนื้อวัวคุณภาพดี คัดสรรพิเศษ สดใหม่ทุกวัน',
        avatarUrl: 'https://placehold.co/128x128.png',
        bannerUrl: 'https://placehold.co/1600x400.png',
        rating: 5.0,
        reviewCount: 42
    },
     {
        id: '101',
        name: 'สวนผลไม้ป้าไหว',
        description: 'ผลไม้ไทยตามฤดูกาล หวานอร่อยจากสวนโดยตรง',
        avatarUrl: 'https://placehold.co/128x128.png',
        bannerUrl: 'https://placehold.co/1600x400.png',
        rating: 4.9,
        reviewCount: 150
    },
    {
        id: '112',
        name: 'เจ๊ออยอาหารทะเล',
        description: 'อาหารทะเลสดๆ จากมหาชัย ส่งตรงทุกวัน',
        avatarUrl: 'https://placehold.co/128x128.png',
        bannerUrl: 'https://placehold.co/1600x400.png',
        rating: 4.9,
        reviewCount: 88
    },
    {
        id: '113',
        name: 'ฟาร์มไก่ลุงมี',
        description: 'ไข่ไก่สด และเนื้อไก่คุณภาพ จากฟาร์มอารมณ์ดี',
        avatarUrl: 'https://placehold.co/128x128.png',
        bannerUrl: 'https://placehold.co/1600x400.png',
        rating: 4.8,
        reviewCount: 195
    }
];

export async function getVendors(): Promise<Vendor[]> {
    return Promise.resolve(mockVendors);
}

export async function getVendor(id: string): Promise<Vendor | undefined> {
    return Promise.resolve(mockVendors.find(v => v.id === id));
}
