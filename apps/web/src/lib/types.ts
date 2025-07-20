export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  vendor: string;
  vendorId: string;
  rating: number;
  reviewCount: number;
  description: string;
  dataAiHint?: string;
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  rating: number;
  reviewCount: number;
}
