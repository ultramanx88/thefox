import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getProduct, getProductsByVendorId } from '@/lib/products';
import { ProductDetailClient } from '@/components/ProductDetailClient';
import type { Metadata } from 'next';

type Props = {
  params: { id: string, locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id);

  if (!product) {
    return {
      title: 'Product Not Found'
    }
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url: product.imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'article',
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const relatedProducts = (await getProductsByVendorId(product.vendorId)).filter(p => p.id !== product.id);

  // Mocked reviews, as in original component
  const reviews = [
    { id: 1, author: 'ร้านอาหารเจริญสุข', rating: 5, comment: 'ผักสดดีมากครับ สั่งประจำ' },
    { id: 2, author: 'ครัวคุณหน่อย', rating: 4, comment: 'คุณภาพดี แต่บางครั้งขนาดไม่เท่ากัน' },
  ];

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} reviews={reviews} />;
}
