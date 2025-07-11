import { getProducts } from '@/lib/products';
import { getVendors } from '@/lib/vendors';
import { locales } from '@/i18n';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.thefox.com'; // Replace with your actual domain

  // Static pages
  const staticRoutes = ['', '/register/vendor', '/register/shopper'];

  const staticUrls = staticRoutes.flatMap(route => 
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
    }))
  );

  // Dynamic product pages
  const products = await getProducts();
  const productUrls = products.flatMap(product => 
    locales.map(locale => ({
      url: `${baseUrl}/${locale}/products/${product.id}`,
      lastModified: new Date(),
    }))
  );

  // Dynamic vendor pages
  const vendors = await getVendors();
  const vendorUrls = vendors.flatMap(vendor => 
    locales.map(locale => ({
      url: `${baseUrl}/${locale}/vendors/${vendor.id}`,
      lastModified: new Date(),
    }))
  );

  return [
    ...staticUrls,
    ...productUrls,
    ...vendorUrls,
  ];
}
