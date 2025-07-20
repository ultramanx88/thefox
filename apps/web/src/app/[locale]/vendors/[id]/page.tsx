import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getVendor } from '@/lib/vendors';
import { getProductsByVendorId } from '@/lib/products';
import { VendorProfileClient } from '@/components/VendorProfileClient';
import type { Metadata } from 'next';

type Props = {
  params: { id: string, locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vendor = await getVendor(params.id);

  if (!vendor) {
    return {
      title: 'Vendor Not Found'
    }
  }

  return {
    title: vendor.name,
    description: vendor.description,
    openGraph: {
      title: vendor.name,
      description: vendor.description,
      images: [
        {
          url: vendor.bannerUrl,
          width: 1600,
          height: 400,
          alt: vendor.name,
        },
      ],
    },
  };
}

export default async function VendorProfilePage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  const vendor = await getVendor(params.id);

  if (!vendor) {
    notFound();
  }

  const products = await getProductsByVendorId(vendor.id);

  return <VendorProfileClient vendor={vendor} products={products} />;
}
